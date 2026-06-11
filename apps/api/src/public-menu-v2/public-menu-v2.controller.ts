import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PublicMenuV2Service } from './public-menu-v2.service';
import type { PublicMenuV2PriceRequest } from './public-menu-v2.types';

@Controller('public-menu-v2')
export class PublicMenuV2Controller {
  constructor(private readonly publicMenuV2Service: PublicMenuV2Service) {}

  @Get(':tenantSlug')
  findBySlug(@Param('tenantSlug') tenantSlug: string) {
    return this.publicMenuV2Service.findBySlug(tenantSlug);
  }

  @Post(':tenantSlug/price')
  calculatePrice(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: PublicMenuV2PriceRequest,
  ) {
    return this.publicMenuV2Service.calculatePriceBySlug(tenantSlug, body);
  }
}
