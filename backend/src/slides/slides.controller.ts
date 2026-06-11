import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { BulkSyncSlidesDto } from './dto/bulk-sync-slides.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client.js';

@Controller('modules/:moduleId/slides')
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Get()
  async getSlides(@Param('moduleId') moduleId: string) {
    return this.slidesService.findAllByModule(moduleId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CORE)
  async syncSlides(
    @Param('moduleId') moduleId: string,
    @Body() dto: BulkSyncSlidesDto,
  ) {
    return this.slidesService.syncSlides(moduleId, dto);
  }
}
