import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('topics')
  async findTopics(@Request() req) {
    return this.learningService.findTopics(req.user.id);
  }

  @Get('topics/:slug')
  async findTopicBySlug(@Param('slug') slug: string, @Request() req) {
    return this.learningService.findTopicBySlug(slug, req.user.id);
  }

  @Get('continue')
  async findContinue(@Request() req) {
    return this.learningService.findContinueModule(req.user.id);
  }
}
