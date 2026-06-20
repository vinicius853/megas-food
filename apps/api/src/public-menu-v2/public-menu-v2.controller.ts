import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { PublicMenuV2Service } from './public-menu-v2.service';
import { PublicMenuV2PriceDto } from './dto/public-menu-v2-price.dto';

@Controller('public-menu-v2')
export class PublicMenuV2Controller {
  constructor(private readonly publicMenuV2Service: PublicMenuV2Service) {}

  @Get(':tenantSlug')
  findBySlug(@Param('tenantSlug') tenantSlug: string) {
    return this.publicMenuV2Service.findBySlug(tenantSlug);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post(':tenantSlug/price')
  calculatePrice(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: PublicMenuV2PriceDto,
  ) {
    return this.publicMenuV2Service.calculatePriceBySlug(tenantSlug, body);
  }
}
