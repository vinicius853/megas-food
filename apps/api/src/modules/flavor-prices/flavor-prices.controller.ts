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

import { FlavorPricesService } from './flavor-prices.service'
import { CreateFlavorPriceDto } from './dto/create-flavor-price.dto'
import { UpdateFlavorPriceDto } from './dto/update-flavor-price.dto'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

@Controller('flavor-prices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FlavorPricesController {
  constructor(private readonly flavorPricesService: FlavorPricesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateFlavorPriceDto) {
    return this.flavorPricesService.create(req.user.tenantId, dto)
  }

  @Get()
  findAll(@Req() req: any) {
    return this.flavorPricesService.findAll(req.user.tenantId)
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.flavorPricesService.findOne(req.user.tenantId, id)
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFlavorPriceDto,
  ) {
    return this.flavorPricesService.update(req.user.tenantId, id, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.flavorPricesService.remove(req.user.tenantId, id)
  }
}
