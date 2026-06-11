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
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client.js';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  async findAll() {
    return this.modulesService.findAll();
  }

  @Get('slug/:slug')
  async findOneBySlug(@Param('slug') slug: string) {
    return this.modulesService.findOneBySlug(slug);
  }

  @Get('tier/:tier')
  async findByTier(@Param('tier') tier: string) {
    return this.modulesService.findByTier(tier);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CORE)
  async create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CORE)
  async reorder(@Body() reorderModulesDto: ReorderModulesDto) {
    return this.modulesService.reorder(reorderModulesDto);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CORE)
  async duplicate(@Param('id') id: string) {
    return this.modulesService.duplicate(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CORE)
  async update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateModuleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CORE)
  async remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }
}
