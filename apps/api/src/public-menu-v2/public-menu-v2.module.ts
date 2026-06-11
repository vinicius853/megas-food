import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { PriceEngineModule } from '../modules/price-engine/price-engine.module';
import { BillingModule } from '../modules/billing/billing.module';

import { PublicMenuV2Controller } from './public-menu-v2.controller';
import { PublicMenuV2Service } from './public-menu-v2.service';

@Module({
  imports: [PrismaModule, PriceEngineModule, BillingModule],
  controllers: [PublicMenuV2Controller],
  providers: [PublicMenuV2Service],
})
export class PublicMenuV2Module {}
