import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Module } from '../../generated/prisma/client.js';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Module[]> {
    return this.prisma.module.findMany({
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }

    return module;
  }

  async findOneBySlug(slug: string) {
    const module = await this.prisma.module.findUnique({
      where: { slug },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Module with slug "${slug}" not found`);
    }

    return module;
  }

  async findByTier(tier: string): Promise<Module[]> {
    return this.prisma.module.findMany({
      where: { tier },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async create(dto: CreateModuleDto): Promise<Module> {
    const slug = await this.generateUniqueSlug(dto.name);

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const maxModule = await this.prisma.module.findFirst({
        orderBy: { orderIndex: 'desc' },
      });
      orderIndex = maxModule ? maxModule.orderIndex + 1 : 0;
    }

    return this.prisma.module.create({
      data: {
        name: dto.name,
        description: dto.description,
        tier: dto.tier,
        xpPoints: dto.xpPoints,
        estimatedMinutes: dto.estimatedMinutes,
        orderIndex,
        slug,
      },
    });
  }

  async update(id: string, dto: UpdateModuleDto): Promise<Module> {
    const existing = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }

    const data: Partial<Omit<Module, 'id' | 'createdAt' | 'updatedAt'>> = {
      name: dto.name,
      description: dto.description,
      tier: dto.tier,
      xpPoints: dto.xpPoints,
      estimatedMinutes: dto.estimatedMinutes,
      orderIndex: dto.orderIndex,
    };

    if (dto.name && dto.name !== existing.name) {
      data.slug = await this.generateUniqueSlug(dto.name);
    }

    return this.prisma.module.update({
      where: { id },
      data,
    });
  }

  /**
   * Remove a module.
   * Hard delete is implemented now, but structured in a single service method
   * to facilitate soft-delete conversion later without altering controller contracts.
   */
  async remove(id: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.module.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }

    await this.prisma.module.delete({
      where: { id },
    });

    return { success: true };
  }

  async duplicate(id: string) {
    const original = await this.prisma.module.findUnique({
      where: { id },
      include: {
        slides: true,
        questions: true,
      },
    });

    if (!original) {
      throw new NotFoundException(`Module with ID "${id}" not found`);
    }

    const newName = `${original.name} Copy`;
    const newSlug = await this.generateUniqueSlug(newName);

    const maxModule = await this.prisma.module.findFirst({
      orderBy: { orderIndex: 'desc' },
    });
    const nextOrderIndex = maxModule ? maxModule.orderIndex + 1 : 0;

    return this.prisma.module.create({
      data: {
        name: newName,
        description: original.description,
        tier: original.tier,
        xpPoints: original.xpPoints,
        estimatedMinutes: original.estimatedMinutes,
        orderIndex: nextOrderIndex,
        slug: newSlug,
        slides: {
          create: original.slides.map((slide) => ({
            title: slide.title,
            layoutType: slide.layoutType,
            imageUrl: slide.imageUrl,
            bullets: slide.bullets,
            orderIndex: slide.orderIndex,
          })),
        },
        questions: {
          create: original.questions.map((question) => ({
            question: question.question,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            orderIndex: question.orderIndex,
          })),
        },
      },
      include: {
        slides: {
          orderBy: { orderIndex: 'asc' },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async reorder(dto: ReorderModulesDto): Promise<{ success: boolean }> {
    // 1. Verify all IDs exist and fetch their current order index in a single query
    const existingModules = await this.prisma.module.findMany({
      where: {
        id: { in: dto.ids },
      },
      select: {
        id: true,
        orderIndex: true,
      },
    });

    if (existingModules.length !== dto.ids.length) {
      throw new NotFoundException('One or more module IDs not found');
    }

    // 2. Compare the current orderIndex values against the desired ordering
    const moduleMap = new Map<string, number>();
    for (const m of existingModules) {
      moduleMap.set(m.id, m.orderIndex);
    }

    const updateOperations: any[] = [];
    for (let index = 0; index < dto.ids.length; index++) {
      const id = dto.ids[index];
      const currentOrder = moduleMap.get(id);
      if (currentOrder !== index) {
        updateOperations.push(
          this.prisma.module.update({
            where: { id },
            data: { orderIndex: index },
          }),
        );
      }
    }

    // 3. If no modules require updates, skip transaction entirely
    if (updateOperations.length === 0) {
      return { success: true };
    }

    // 4. Execute only the filtered update operations inside a Prisma transaction with a 15s timeout
    await this.prisma.$transaction(updateOperations, {
      timeout: 15000,
    });

    return { success: true };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const targetSlug = baseSlug || 'module';
    let slug = targetSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.module.findUnique({
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
