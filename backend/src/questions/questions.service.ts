import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkSyncQuestionsDto } from './dto/bulk-sync-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAllByModule(moduleId: string) {
    const moduleExists = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleExists) {
      throw new NotFoundException(`Module with ID "${moduleId}" not found`);
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { moduleId },
      orderBy: { orderIndex: 'asc' },
    });

    return questions.map(({ id, moduleId: _, correctAnswer: __, createdAt, updatedAt, ...rest }) => rest);
  }

  async syncQuestions(moduleId: string, dto: BulkSyncQuestionsDto) {
    const moduleExists = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleExists) {
      throw new NotFoundException(`Module with ID "${moduleId}" not found`);
    }

    const questionsData = dto.questions.map((q) => ({
      moduleId,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      orderIndex: q.orderIndex,
    }));

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all existing quiz questions for this module
      await tx.quizQuestion.deleteMany({
        where: { moduleId },
      });

      // 2. Create new questions
      if (questionsData.length > 0) {
        await tx.quizQuestion.createMany({
          data: questionsData,
        });
      }

      // 3. Retrieve and return saved questions preserving orderIndex
      const savedQuestions = await tx.quizQuestion.findMany({
        where: { moduleId },
        orderBy: { orderIndex: 'asc' },
      });

      return savedQuestions.map(({ id, moduleId: _, createdAt, updatedAt, ...rest }) => rest);
    });
  }
}
