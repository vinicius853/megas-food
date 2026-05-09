import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator'

import { CategoriesService } from './categories.service'

import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto)
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.categoriesService.findAll(tenantId)
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto)
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.categoriesService.remove(tenantId, id)
  }
}
