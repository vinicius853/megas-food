import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { CouponsModule } from '../coupons/coupons.module'
import { OrdersGateway } from '../orders/gateways/orders.gateway'
import { PriceEngineModule } from '../price-engine/price-engine.module'

import { PublicOrdersV2Controller } from './public-orders-v2.controller'
import { PublicOrdersV2Service } from './public-orders-v2.service'

@Module({
  imports: [PrismaModule, AuthModule, CouponsModule, PriceEngineModule],
  controllers: [PublicOrdersV2Controller],
  providers: [PublicOrdersV2Service, OrdersGateway],
})
export class PublicOrdersV2Module {}
