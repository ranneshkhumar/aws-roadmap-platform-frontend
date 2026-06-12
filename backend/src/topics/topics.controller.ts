import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client.js';

@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CORE)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  async findAll() {
    return this.topicsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Post()
  async create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Post('reorder')
  async reorder(@Body() reorderTopicsDto: ReorderTopicsDto) {
    return this.topicsService.reorder(reorderTopicsDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
