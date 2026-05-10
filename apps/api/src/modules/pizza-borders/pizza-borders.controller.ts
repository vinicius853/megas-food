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

import { PizzaBordersService } from './pizza-borders.service'

import { CreatePizzaBorderDto } from './dto/create-pizza-border.dto'
import { UpdatePizzaBorderDto } from './dto/update-pizza-border.dto'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@Controller('pizza-borders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PizzaBordersController {
  constructor(private readonly pizzaBordersService: PizzaBordersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreatePizzaBorderDto) {
    return this.pizzaBordersService.create(req.user.tenantId, dto)
  }

  @Get()
  findAll(@Req() req: any) {
    return this.pizzaBordersService.findAll(req.user.tenantId)
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.pizzaBordersService.findOne(req.user.tenantId, id)
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePizzaBorderDto,
  ) {
    return this.pizzaBordersService.update(req.user.tenantId, id, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.pizzaBordersService.remove(req.user.tenantId, id)
  }
}
