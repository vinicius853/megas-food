import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { BillingModule } from '../billing/billing.module'
import { CouponsModule } from '../coupons/coupons.module'
import { OrdersGateway } from '../orders/gateways/orders.gateway'
import { OrderNumberingService } from '../orders/order-numbering.service'
import { PriceEngineModule } from '../price-engine/price-engine.module'
import { WhatsAppModule } from '../whatsapp/whatsapp.module'

import { PublicOrdersV2Controller } from './public-orders-v2.controller'
import { PublicOrdersV2Service } from './public-orders-v2.service'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BillingModule,
    CouponsModule,
    PriceEngineModule,
    WhatsAppModule,
  ],
  controllers: [PublicOrdersV2Controller],
  providers: [PublicOrdersV2Service, OrderNumberingService, OrdersGateway],
})
export class PublicOrdersV2Module {}
