import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CORE, Role.CREW)
@Controller('learners')
export class LearnersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAllLearners();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const detail = await this.usersService.findLearnerDetail(id);
    if (!detail) {
      throw new NotFoundException(`Learner with ID "${id}" not found`);
    }
    return detail;
  }
}
