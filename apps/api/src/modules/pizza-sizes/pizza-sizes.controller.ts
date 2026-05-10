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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator'

import { PizzaSizesService } from './pizza-sizes.service'

import { CreatePizzaSizeDto } from './dto/create-pizza-size.dto'
import { UpdatePizzaSizeDto } from './dto/update-pizza-size.dto'

@Controller('pizza-sizes')
@UseGuards(JwtAuthGuard)
export class PizzaSizesController {
  constructor(private readonly pizzaSizesService: PizzaSizesService) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreatePizzaSizeDto,
  ) {
    return this.pizzaSizesService.create(tenantId, dto)
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('productId') productId?: string,
  ) {
    return this.pizzaSizesService.findAll(tenantId, productId)
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePizzaSizeDto,
  ) {
    return this.pizzaSizesService.update(tenantId, id, dto)
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.pizzaSizesService.remove(tenantId, id)
  }
}
