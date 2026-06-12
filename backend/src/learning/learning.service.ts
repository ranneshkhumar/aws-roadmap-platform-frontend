import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleLevel, ProgressStatus } from '../../generated/prisma/client.js';
import { TopicListResponseDto, TopicSummaryDto } from './dto/topic-summary.dto';
import {
  TopicDetailDto,
  ModuleSummaryDto,
  TopicProgressDto,
} from './dto/topic-detail.dto';
import {
  ContinueResponseDto,
  ContinueModuleDto,
} from './dto/continue-response.dto';

const LEVEL_ORDER: Record<ModuleLevel, number> = {
  [ModuleLevel.BEGINNER]: 0,
  [ModuleLevel.INTERMEDIATE]: 1,
  [ModuleLevel.ADVANCED]: 2,
};

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}

  async findTopics(userId: string): Promise<TopicListResponseDto> {
    const [topics, allProgress] = await Promise.all([
      this.prisma.topic.findMany({
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          orderIndex: true,
        },
      }),
      this.prisma.userModuleProgress.findMany({
        where: { userId },
        select: { moduleId: true, status: true },
      }),
    ]);

    if (topics.length === 0) {
      return { topics: [] };
    }

    const topicIds = topics.map((t) => t.id);

    const allModules = await this.prisma.module.findMany({
      where: { topicId: { in: topicIds } },
      select: { id: true, topicId: true },
    });

    const allModuleIds = new Set(allModules.map((m) => m.id));

    const progressMap = new Map<string, ProgressStatus>();
    for (const p of allProgress) {
      if (allModuleIds.has(p.moduleId)) {
        progressMap.set(p.moduleId, p.status);
      }
    }

    const topicModuleIds = new Map<string, string[]>();
    for (const mod of allModules) {
      if (mod.topicId) {
        const ids = topicModuleIds.get(mod.topicId) || [];
        ids.push(mod.id);
        topicModuleIds.set(mod.topicId, ids);
      }
    }

    const topicSummaries: TopicSummaryDto[] = topics.map((topic) => {
      const moduleIds = topicModuleIds.get(topic.id) || [];
      const totalModules = moduleIds.length;
      const completedModules = moduleIds.filter(
        (id) => progressMap.get(id) === 'COMPLETED',
      ).length;

      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (completedModules === totalModules && totalModules > 0) {
        status = 'COMPLETED';
      } else if (completedModules > 0) {
        status = 'IN_PROGRESS';
      }

      return {
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        orderIndex: topic.orderIndex,
        totalModules,
        completedModules,
        status,
      };
    });

    return { topics: topicSummaries };
  }

  async findTopicBySlug(slug: string, userId: string): Promise<TopicDetailDto> {
    const topic = await this.prisma.topic.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        orderIndex: true,
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with slug "${slug}" not found`);
    }

    const modules = await this.prisma.module.findMany({
      where: { topicId: topic.id },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        level: true,
        tier: true,
        xpPoints: true,
        estimatedMinutes: true,
        orderIndex: true,
      },
    });

    const moduleIds = modules.map((m) => m.id);

    const [progressRecords, slideCounts, questionCounts] = await Promise.all([
      this.prisma.userModuleProgress.findMany({
        where: { userId, moduleId: { in: moduleIds } },
        select: { moduleId: true, status: true, score: true },
      }),
      this.prisma.learningSlide.groupBy({
        by: ['moduleId'],
        _count: { id: true },
        where: { moduleId: { in: moduleIds } },
      }),
      this.prisma.quizQuestion.groupBy({
        by: ['moduleId'],
        _count: { id: true },
        where: { moduleId: { in: moduleIds } },
      }),
    ]);

    const progressMap = new Map<
      string,
      { status: ProgressStatus; score: number | null }
    >();
    for (const p of progressRecords) {
      progressMap.set(p.moduleId, { status: p.status, score: p.score });
    }

    const slideCountMap = new Map<string, number>();
    for (const sc of slideCounts) {
      slideCountMap.set(sc.moduleId, sc._count.id);
    }

    const questionCountMap = new Map<string, number>();
    for (const qc of questionCounts) {
      questionCountMap.set(qc.moduleId, qc._count.id);
    }

    const sortedModules = [...modules].sort((a, b) => {
      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;
      return a.orderIndex - b.orderIndex;
    });

    const moduleSummaries: ModuleSummaryDto[] = sortedModules.map((mod, index) => {
      const progress = progressMap.get(mod.id);
      let status: ProgressStatus;
      if (progress) {
        status = progress.status;
      } else if (index === 0) {
        status = 'UNLOCKED';
      } else {
        status = 'LOCKED';
      }
      return {
        slug: mod.slug,
        name: mod.name,
        description: mod.description,
        level: mod.level ?? ModuleLevel.BEGINNER,
        tier: mod.tier,
        xpPoints: mod.xpPoints,
        estimatedMinutes: mod.estimatedMinutes,
        orderIndex: mod.orderIndex,
        status,
        score: progress?.score ?? null,
        slideCount: slideCountMap.get(mod.id) || 0,
        questionCount: questionCountMap.get(mod.id) || 0,
      };
    });

    const totalModules = modules.length;
    const completedModules = moduleSummaries.filter(
      (m) => m.status === 'COMPLETED',
    ).length;

    let topicStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' =
      'NOT_STARTED';
    if (completedModules === totalModules && totalModules > 0) {
      topicStatus = 'COMPLETED';
    } else if (completedModules > 0) {
      topicStatus = 'IN_PROGRESS';
    }

    const progress: TopicProgressDto = {
      totalModules,
      completedModules,
      status: topicStatus,
    };

    return {
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      orderIndex: topic.orderIndex,
      modules: moduleSummaries,
      progress,
    };
  }

  async findContinueModule(userId: string): Promise<ContinueResponseDto> {
    const [topics, allProgress] = await Promise.all([
      this.prisma.topic.findMany({
        orderBy: { orderIndex: 'asc' },
        select: { id: true, slug: true, name: true, orderIndex: true },
      }),
      this.prisma.userModuleProgress.findMany({
        where: { userId },
        select: { moduleId: true, status: true },
      }),
    ]);

    const progressMap = new Map<string, string>();
    for (const p of allProgress) {
      progressMap.set(p.moduleId, p.status);
    }

    const topicMap = new Map<
      string,
      { slug: string; name: string; orderIndex: number }
    >();
    for (const t of topics) {
      topicMap.set(t.id, {
        slug: t.slug,
        name: t.name,
        orderIndex: t.orderIndex,
      });
    }

    const topicIds = topics.map((t) => t.id);

    const allModules = await this.prisma.module.findMany({
      where: { topicId: { in: topicIds } },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        level: true,
        tier: true,
        estimatedMinutes: true,
        topicId: true,
        orderIndex: true,
      },
    });

    const sortedModules = [...allModules].sort((a, b) => {
      const topicA = topicMap.get(a.topicId || '');
      const topicB = topicMap.get(b.topicId || '');

      const topicOrderA = topicA?.orderIndex ?? 0;
      const topicOrderB = topicB?.orderIndex ?? 0;

      if (topicOrderA !== topicOrderB) {
        return topicOrderA - topicOrderB;
      }

      const levelA = a.level ? LEVEL_ORDER[a.level] : 3;
      const levelB = b.level ? LEVEL_ORDER[b.level] : 3;
      if (levelA !== levelB) return levelA - levelB;
      return a.orderIndex - b.orderIndex;
    });

    const nextModule = sortedModules.find((mod, index) => {
      const status = progressMap.get(mod.id);
      if (status === 'COMPLETED') return false;
      if (status === 'UNLOCKED') return true;
      if (!status && index === 0) return true;
      return false;
    });

    if (!nextModule) {
      return { module: null };
    }

    const topic = topicMap.get(nextModule.topicId || '');

    const [slideCount, questionCount] = await Promise.all([
      this.prisma.learningSlide.count({ where: { moduleId: nextModule.id } }),
      this.prisma.quizQuestion.count({ where: { moduleId: nextModule.id } }),
    ]);

    const continueModule: ContinueModuleDto = {
      slug: nextModule.slug,
      name: nextModule.name,
      description: nextModule.description,
      level: nextModule.level ?? ModuleLevel.BEGINNER,
      tier: nextModule.tier,
      topicSlug: topic?.slug || '',
      topicName: topic?.name || '',
      estimatedMinutes: nextModule.estimatedMinutes,
      slideCount,
      questionCount,
    };

    return { module: continueModule };
  }
}
