import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkSyncSlidesDto } from './dto/bulk-sync-slides.dto';

@Injectable()
export class SlidesService {
  constructor(private prisma: PrismaService) {}

  async findAllByModule(moduleId: string) {
    const moduleExists = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleExists) {
      throw new NotFoundException(`Module with ID "${moduleId}" not found`);
    }

    const slides = await this.prisma.learningSlide.findMany({
      where: { moduleId },
      orderBy: { orderIndex: 'asc' },
    });

    return slides.map(
      ({ id, moduleId: _, createdAt, updatedAt, ...rest }) => rest,
    );
  }

  async syncSlides(moduleId: string, dto: BulkSyncSlidesDto) {
    const moduleExists = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleExists) {
      throw new NotFoundException(`Module with ID "${moduleId}" not found`);
    }

    const slidesData = dto.slides.map((slide) => ({
      moduleId,
      title: slide.title,
      layoutType: slide.layoutType,
      orderIndex: slide.orderIndex,
      imageUrl: slide.imageUrl || null,
      bullets: slide.bullets || [],
    }));

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all existing slides for this module
      await tx.learningSlide.deleteMany({
        where: { moduleId },
      });

      // 2. Create new slides
      if (slidesData.length > 0) {
        await tx.learningSlide.createMany({
          data: slidesData,
        });
      }

      // 3. Retrieve and return saved slides preserving orderIndex
      const savedSlides = await tx.learningSlide.findMany({
        where: { moduleId },
        orderBy: { orderIndex: 'asc' },
      });

      return savedSlides.map(
        ({ id, moduleId: _, createdAt, updatedAt, ...rest }) => rest,
      );
    });
  }
}
