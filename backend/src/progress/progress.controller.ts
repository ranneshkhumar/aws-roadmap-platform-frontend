import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { QuizAttemptDto } from './dto/quiz-attempt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('progress/me')
  async getMyProgress(@Request() req) {
    return this.progressService.getUserProgress(req.user.id);
  }

  @Get('modules/:moduleId/progress')
  async getModuleProgress(@Param('moduleId') moduleId: string, @Request() req) {
    return this.progressService.getModuleProgress(req.user.id, moduleId);
  }

  @Post('modules/:moduleId/quiz/attempt')
  async submitQuizAttempt(
    @Param('moduleId') moduleId: string,
    @Body() dto: QuizAttemptDto,
    @Request() req,
  ) {
    return this.progressService.submitQuizAttempt(req.user.id, moduleId, dto);
  }

  @Get('modules/:moduleId/quiz/review')
  async getQuizReview(@Param('moduleId') moduleId: string, @Request() req) {
    return this.progressService.getQuizReview(req.user.id, moduleId);
  }
}
