import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'

import { PizzaFlavorsService } from './pizza-flavors.service'
import { CreatePizzaFlavorDto } from './dto/create-pizza-flavor.dto'
import { UpdatePizzaFlavorDto } from './dto/update-pizza-flavor.dto'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@Controller('pizza-flavors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PizzaFlavorsController {
  constructor(private readonly pizzaFlavorsService: PizzaFlavorsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreatePizzaFlavorDto) {
    return this.pizzaFlavorsService.create(req.user.tenantId, dto)
  }

  @Get()
  findAll(@Req() req: any) {
    return this.pizzaFlavorsService.findAll(req.user.tenantId)
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.pizzaFlavorsService.findOne(req.user.tenantId, id)
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePizzaFlavorDto,
  ) {
    return this.pizzaFlavorsService.update(req.user.tenantId, id, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.pizzaFlavorsService.remove(req.user.tenantId, id)
  }
}
