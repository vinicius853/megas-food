import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { RolesGuard } from '../auth/guards/roles.guard'

import { ProductsService } from './products.service'

import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT_OWNER)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenantId, dto)
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.productsService.findAll(tenantId, categoryId)
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto)
  }

  @Delete(':id')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productsService.remove(tenantId, id)
  }
}
