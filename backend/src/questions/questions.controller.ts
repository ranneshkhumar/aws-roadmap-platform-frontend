import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { BulkSyncQuestionsDto } from './dto/bulk-sync-questions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client.js';

@Controller('modules/:moduleId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(@Param('moduleId') moduleId: string) {
    return this.questionsService.findAllByModule(moduleId);
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CORE)
  async syncQuestions(
    @Param('moduleId') moduleId: string,
    @Body() dto: BulkSyncQuestionsDto,
  ) {
    return this.questionsService.syncQuestions(moduleId, dto);
  }
}
