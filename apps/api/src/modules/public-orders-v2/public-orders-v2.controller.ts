import { Body, Controller, Param, Post } from '@nestjs/common';

import { CreatePublicOrderV2Dto } from './dto/create-public-order-v2.dto';
import { PublicOrdersV2Service } from './public-orders-v2.service';

@Controller('public-orders-v2')
export class PublicOrdersV2Controller {
  constructor(private readonly publicOrdersV2Service: PublicOrdersV2Service) {}

  @Post(':tenantSlug')
  create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePublicOrderV2Dto,
  ) {
    return this.publicOrdersV2Service.createByTenantSlug(tenantSlug, dto);
  }
}
