import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizAttemptDto } from './dto/quiz-attempt.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getUserProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const progressList = await this.prisma.userModuleProgress.findMany({
      where: { userId },
    });

    const completedModules = progressList
      .filter((p) => p.status === 'COMPLETED')
      .map((p) => p.moduleId);

    const unlockedModules = progressList
      .filter((p) => p.status === 'UNLOCKED')
      .map((p) => p.moduleId);

    // If the first module in the database has no progress record, implicitly mark it as unlocked
    const firstModule = await this.prisma.module.findFirst({
      orderBy: { orderIndex: 'asc' },
    });

    if (firstModule) {
      const hasProgress = progressList.some((p) => p.moduleId === firstModule.id);
      if (!hasProgress) {
        unlockedModules.push(firstModule.id);
      }
    }

    return {
      currentXP: user.xp,
      streak: user.streak,
      completedModules,
      unlockedModules,
    };
  }

  async getModuleProgress(userId: string, moduleId: string) {
    const progress = await this.prisma.userModuleProgress.findUnique({
      where: {
        userId_moduleId: { userId, moduleId },
      },
    });

    if (progress) {
      return { status: progress.status };
    }

    // Fallback: Check if it is the first module (lowest orderIndex)
    const firstModule = await this.prisma.module.findFirst({
      orderBy: { orderIndex: 'asc' },
    });

    if (firstModule && firstModule.id === moduleId) {
      return { status: 'UNLOCKED' };
    }

    return { status: 'LOCKED' };
  }

  async submitQuizAttempt(userId: string, moduleId: string, dto: QuizAttemptDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID "${moduleId}" not found`);
    }

    // Load questions to evaluate score server-side
    const questions = await this.prisma.quizQuestion.findMany({
      where: { moduleId },
      orderBy: { orderIndex: 'asc' },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Module has no quiz questions configured');
    }

    // Check correctness
    let correctAnswersCount = 0;
    const totalQuestionsCount = questions.length;

    const answerRecords: { questionId: string; selectedAnswer: string; isCorrect: boolean }[] = [];
    for (const question of questions) {
      const userAnswer = dto.answers.find((a) => a.questionOrder === question.orderIndex);
      const selectedAnswer = userAnswer ? userAnswer.selectedAnswer : '';
      const isCorrect = userAnswer ? userAnswer.selectedAnswer === question.correctAnswer : false;

      if (isCorrect) {
        correctAnswersCount++;
      }

      answerRecords.push({
        questionId: question.id,
        selectedAnswer,
        isCorrect,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // Check if module is already completed
      const existingProgress = await tx.userModuleProgress.findUnique({
        where: {
          userId_moduleId: { userId, moduleId },
        },
      });

      const isAlreadyCompleted = existingProgress && existingProgress.status === 'COMPLETED';

      // XP calculation: moduleXP + (correctAnswers / totalQuestions) * moduleXP
      // If already completed, award 0 XP (anti-farming rule)
      const xpEarned = isAlreadyCompleted
        ? 0
        : Math.round(module.xpPoints + (correctAnswersCount / totalQuestionsCount) * module.xpPoints);

      // 1. Store QuizAttempt
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          moduleId,
          totalQuestions: totalQuestionsCount,
          correctAnswers: correctAnswersCount,
          percentage: (correctAnswersCount / totalQuestionsCount) * 100,
          xpEarned,
        },
      });

      // 2. Store QuizAttemptAnswers
      await tx.quizAttemptAnswer.createMany({
        data: answerRecords.map((rec) => ({
          attemptId: attempt.id,
          questionId: rec.questionId,
          selectedAnswer: rec.selectedAnswer,
          isCorrect: rec.isCorrect,
        })),
      });

      // 3. Update User.xp if there's any reward
      if (xpEarned > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            xp: {
              increment: xpEarned,
            },
          },
        });
      }

      // 4. Update progress and unlock next module if new completion
      if (!isAlreadyCompleted) {
        await tx.userModuleProgress.upsert({
          where: {
            userId_moduleId: { userId, moduleId },
          },
          create: {
            userId,
            moduleId,
            status: 'COMPLETED',
            score: correctAnswersCount,
            xpEarned,
            completedAt: new Date(),
          },
          update: {
            status: 'COMPLETED',
            score: correctAnswersCount,
            xpEarned,
            completedAt: new Date(),
          },
        });

        // 5. Unlock exactly one next module in sequence (module with the next higher orderIndex)
        const nextModule = await tx.module.findFirst({
          where: {
            orderIndex: {
              gt: module.orderIndex,
            },
          },
          orderBy: { orderIndex: 'asc' },
        });

        if (nextModule) {
          const nextProgress = await tx.userModuleProgress.findUnique({
            where: {
              userId_moduleId: {
                userId,
                moduleId: nextModule.id,
              },
            },
          });

          // Only unlock if not already created/completed/unlocked
          if (!nextProgress) {
            await tx.userModuleProgress.create({
              data: {
                userId,
                moduleId: nextModule.id,
                status: 'UNLOCKED',
              },
            });
          } else if (nextProgress.status === 'LOCKED') {
            await tx.userModuleProgress.update({
              where: {
                userId_moduleId: {
                  userId,
                  moduleId: nextModule.id,
                },
              },
              data: {
                status: 'UNLOCKED',
              },
            });
          }
        }
      } else {
        // If already completed, just update the score if needed (keep highest)
        const currentBestScore = existingProgress.score ?? 0;
        const newScore = Math.max(currentBestScore, correctAnswersCount);
        
        await tx.userModuleProgress.update({
          where: {
            userId_moduleId: { userId, moduleId },
          },
          data: {
            score: newScore,
          },
        });
      }

      return {
        correctAnswers: correctAnswersCount,
        totalQuestions: totalQuestionsCount,
        percentage: Math.round((correctAnswersCount / totalQuestionsCount) * 100),
        xpEarned,
      };
    });
  }
}
