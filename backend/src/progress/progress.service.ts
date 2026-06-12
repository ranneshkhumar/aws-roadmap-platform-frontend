import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

    // Reconcile progression against current curriculum order.
    // Find the first module (by orderIndex) that the learner has not completed,
    // and ensure exactly that module is UNLOCKED. All later missing modules stay LOCKED.
    const allModules = await this.prisma.module.findMany({
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    });

    if (allModules.length > 0) {
      const progressMap = new Map(
        progressList.map((p) => [p.moduleId, p.status]),
      );
      let reconciledUnlock: string | null = null;

      for (const mod of allModules) {
        const status = progressMap.get(mod.id);
        if (status === 'COMPLETED') continue;

        // First missing module — should be UNLOCKED
        if (!reconciledUnlock) {
          reconciledUnlock = mod.id;

          if (status !== 'UNLOCKED') {
            await this.prisma.userModuleProgress.upsert({
              where: { userId_moduleId: { userId, moduleId: mod.id } },
              create: { userId, moduleId: mod.id, status: 'UNLOCKED' },
              update: { status: 'UNLOCKED' },
            });

            if (!unlockedModules.includes(mod.id)) {
              unlockedModules.push(mod.id);
            }
          }
        } else {
          // All later missing modules — ensure LOCKED
          if (status === 'UNLOCKED') {
            await this.prisma.userModuleProgress.update({
              where: { userId_moduleId: { userId, moduleId: mod.id } },
              data: { status: 'LOCKED' },
            });

            const idx = unlockedModules.indexOf(mod.id);
            if (idx !== -1) unlockedModules.splice(idx, 1);
          }
        }
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

  async submitQuizAttempt(
    userId: string,
    moduleId: string,
    dto: QuizAttemptDto,
  ) {
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

    const answerRecords: {
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
    }[] = [];
    for (const question of questions) {
      const userAnswer = dto.answers.find(
        (a) => a.questionOrder === question.orderIndex,
      );
      const selectedAnswer = userAnswer ? userAnswer.selectedAnswer : '';
      const isCorrect = userAnswer
        ? userAnswer.selectedAnswer === question.correctAnswer
        : false;

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

      const isAlreadyCompleted =
        existingProgress && existingProgress.status === 'COMPLETED';

      // XP calculation: moduleXP + (correctAnswers / totalQuestions) * moduleXP
      // If already completed, award 0 XP (anti-farming rule)
      const xpEarned = isAlreadyCompleted
        ? 0
        : Math.round(
            module.xpPoints +
              (correctAnswersCount / totalQuestionsCount) * module.xpPoints,
          );

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
        attemptId: attempt.id,
        correctAnswers: correctAnswersCount,
        totalQuestions: totalQuestionsCount,
        percentage: Math.round(
          (correctAnswersCount / totalQuestionsCount) * 100,
        ),
        xpEarned,
      };
    });
  }

  async getQuizReview(userId: string, moduleId: string) {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { userId, moduleId },
      orderBy: { attemptedAt: 'desc' },
      include: {
        answers: {
          include: { question: true },
          orderBy: { question: { orderIndex: 'asc' } },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('No quiz attempt found for this module');
    }

    return {
      moduleId,
      score: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      xpEarned: attempt.xpEarned,
      completedAt: attempt.attemptedAt.toISOString(),
      answers: attempt.answers.map((a) => ({
        question: a.question.question,
        options: [
          a.question.optionA,
          a.question.optionB,
          a.question.optionC,
          a.question.optionD,
        ],
        selectedAnswer: a.selectedAnswer,
        correctAnswer: a.question.correctAnswer,
        isCorrect: a.isCorrect,
        explanation: a.question.explanation,
      })),
    };
  }
}
