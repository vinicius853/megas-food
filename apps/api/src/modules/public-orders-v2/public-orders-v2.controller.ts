import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

import { CreatePublicOrderV2Dto } from './dto/create-public-order-v2.dto';
import { getPrivacyRequestContext } from './privacy-request-context';
import { PublicOrdersV2Service } from './public-orders-v2.service';

@Controller('public-orders-v2')
export class PublicOrdersV2Controller {
  constructor(private readonly publicOrdersV2Service: PublicOrdersV2Service) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':tenantSlug')
  create(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePublicOrderV2Dto,
    @Req() request: Request,
  ) {
    return this.publicOrdersV2Service.createByTenantSlug(
      tenantSlug,
      dto,
      getPrivacyRequestContext(request),
    );
  }
}
