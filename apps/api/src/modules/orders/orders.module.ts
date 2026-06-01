import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { PrismaModule } from '../../prisma/prisma.module'
import { CouponsModule } from '../coupons/coupons.module'
import { BillingModule } from '../billing/billing.module'

import { OrdersService } from './orders.service'

import { OrdersController } from './orders.controller'
import { PublicOrdersController } from './public-orders.controller'

import { OrdersGateway } from './gateways/orders.gateway'

@Module({
  imports: [PrismaModule, AuthModule, CouponsModule, BillingModule],

  controllers: [
    OrdersController,
    PublicOrdersController,
  ],

  providers: [
    OrdersService,
    OrdersGateway,
  ],
})
export class OrdersModule {}
