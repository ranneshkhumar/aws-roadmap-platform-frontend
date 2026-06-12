import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleLevel } from '../../generated/prisma/client.js';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';

const MODULE_DEFAULTS: Record<
  ModuleLevel,
  {
    tier: string;
    xpPoints: number;
    estimatedMinutes: number;
    levelOffset: number;
  }
> = {
  [ModuleLevel.BEGINNER]: {
    tier: 'Fundamentals',
    xpPoints: 0,
    estimatedMinutes: 0,
    levelOffset: 0,
  },
  [ModuleLevel.INTERMEDIATE]: {
    tier: 'Associate',
    xpPoints: 0,
    estimatedMinutes: 0,
    levelOffset: 1,
  },
  [ModuleLevel.ADVANCED]: {
    tier: 'Professional',
    xpPoints: 0,
    estimatedMinutes: 0,
    levelOffset: 2,
  },
};

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID "${id}" not found`);
    }

    return topic;
  }

  async create(dto: CreateTopicDto) {
    const slug = await this.generateUniqueSlug(dto.name);

    const maxTopic = await this.prisma.topic.findFirst({
      orderBy: { orderIndex: 'desc' },
    });
    const topicOrderIndex = maxTopic ? maxTopic.orderIndex + 1 : 0;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const topic = await tx.topic.create({
          data: {
            name: dto.name,
            slug,
            description: dto.description ?? '',
            orderIndex: topicOrderIndex,
          },
        });

        const modules = await Promise.all(
          Object.values(ModuleLevel).map((level) => {
            const defaults = MODULE_DEFAULTS[level];
            return tx.module.create({
              data: {
                name: `${dto.name} ${level.charAt(0) + level.slice(1).toLowerCase()}`,
                slug: `${slug}-${level.toLowerCase()}`,
                description: '',
                tier: defaults.tier,
                xpPoints: defaults.xpPoints,
                estimatedMinutes: defaults.estimatedMinutes,
                orderIndex: topicOrderIndex * 3 + defaults.levelOffset,
                topicId: topic.id,
                level,
              },
            });
          }),
        );

        return { ...topic, modules };
      });
    } catch (error) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes('slug')) {
          throw new ConflictException(
            `Topic with slug "${slug}" already exists`,
          );
        }
        if (Array.isArray(target) && target.includes('name')) {
          throw new ConflictException(
            `Topic with name "${dto.name}" already exists`,
          );
        }
        throw new ConflictException('Topic already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateTopicDto) {
    const existing = await this.prisma.topic.findUnique({
      where: { id },
      include: { modules: true },
    });

    if (!existing) {
      throw new NotFoundException(`Topic with ID "${id}" not found`);
    }

    const nameChanged = dto.name && dto.name !== existing.name;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const topic = await tx.topic.update({
          where: { id },
          data: {
            name: dto.name,
            description: dto.description,
          },
        });

        if (nameChanged) {
          const newSlug = await this.generateUniqueSlug(dto.name!);

          await tx.topic.update({
            where: { id },
            data: { slug: newSlug },
          });

          for (const mod of existing.modules) {
            const level = mod.level?.toLowerCase() ?? '';
            await tx.module.update({
              where: { id: mod.id },
              data: {
                name: `${dto.name} ${level.charAt(0).toUpperCase() + level.slice(1)}`,
                slug: `${newSlug}-${level}`,
              },
            });
          }

          return tx.topic.findUnique({
            where: { id },
            include: { modules: { orderBy: { orderIndex: 'asc' } } },
          });
        }

        return tx.topic.findUnique({
          where: { id },
          include: { modules: { orderBy: { orderIndex: 'asc' } } },
        });
      });
    } catch (error) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes('slug')) {
          throw new ConflictException(`Topic with slug already exists`);
        }
        if (Array.isArray(target) && target.includes('name')) {
          throw new ConflictException(
            `Topic with name "${dto.name}" already exists`,
          );
        }
        throw new ConflictException('Topic already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.topic.findUnique({
      where: { id },
      include: { modules: true },
    });

    if (!existing) {
      throw new NotFoundException(`Topic with ID "${id}" not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const moduleIds = existing.modules.map((m) => m.id);

      if (moduleIds.length > 0) {
        await tx.learningSlide.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });
        await tx.quizQuestion.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });
        await tx.module.deleteMany({ where: { id: { in: moduleIds } } });
      }

      await tx.topic.delete({ where: { id } });

      return { success: true };
    });
  }

  async reorder(dto: ReorderTopicsDto) {
    const existingTopics = await this.prisma.topic.findMany({
      where: { id: { in: dto.ids } },
      select: { id: true, orderIndex: true },
    });

    if (existingTopics.length !== dto.ids.length) {
      throw new NotFoundException('One or more topic IDs not found');
    }

    const topicMap = new Map<string, number>();
    for (const t of existingTopics) {
      topicMap.set(t.id, t.orderIndex);
    }

    const isNoOp = dto.ids.every((id, index) => topicMap.get(id) === index);
    if (isNoOp) {
      return { success: true };
    }

    const SENTINEL_BASE = -1000;

    const topicUpdates: { id: string; sentinel: number; final: number }[] = [];
    const moduleUpdates: {
      id: string;
      topicId: string;
      sentinel: number;
      final: number;
    }[] = [];

    for (let index = 0; index < dto.ids.length; index++) {
      const id = dto.ids[index];

      topicUpdates.push({
        id,
        sentinel: SENTINEL_BASE - index,
        final: index,
      });

      const modules = await this.prisma.module.findMany({
        where: { topicId: id },
        select: { id: true, level: true },
      });

      for (const mod of modules) {
        const levelOffset =
          mod.level === ModuleLevel.BEGINNER
            ? 0
            : mod.level === ModuleLevel.INTERMEDIATE
              ? 1
              : 2;

        moduleUpdates.push({
          id: mod.id,
          topicId: id,
          sentinel: SENTINEL_BASE - index * 3 - levelOffset,
          final: index * 3 + levelOffset,
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      for (const t of topicUpdates) {
        await tx.topic.update({
          where: { id: t.id },
          data: { orderIndex: t.sentinel },
        });
      }

      for (const m of moduleUpdates) {
        await tx.module.update({
          where: { id: m.id },
          data: { orderIndex: m.sentinel },
        });
      }

      for (const t of topicUpdates) {
        await tx.topic.update({
          where: { id: t.id },
          data: { orderIndex: t.final },
        });
      }

      for (const m of moduleUpdates) {
        await tx.module.update({
          where: { id: m.id },
          data: { orderIndex: m.final },
        });
      }

      return { success: true };
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const targetSlug = baseSlug || 'topic';
    let slug = targetSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.topic.findUnique({
        where: { slug },
      });
      if (!existing) {
        return slug;
      }
      slug = `${targetSlug}-${counter}`;
      counter++;
    }
  }
}
