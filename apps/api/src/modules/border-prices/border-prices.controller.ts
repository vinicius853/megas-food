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

import { BorderPricesService } from './border-prices.service'

import { CreateBorderPriceDto } from './dto/create-border-price.dto'
import { UpdateBorderPriceDto } from './dto/update-border-price.dto'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@Controller('border-prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BorderPricesController {
  constructor(private readonly borderPricesService: BorderPricesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateBorderPriceDto) {
    return this.borderPricesService.create(req.user.tenantId, dto)
  }

  @Get()
  findAll(@Req() req: any) {
    return this.borderPricesService.findAll(req.user.tenantId)
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.borderPricesService.findOne(req.user.tenantId, id)
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBorderPriceDto,
  ) {
    return this.borderPricesService.update(req.user.tenantId, id, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.borderPricesService.remove(req.user.tenantId, id)
  }
}