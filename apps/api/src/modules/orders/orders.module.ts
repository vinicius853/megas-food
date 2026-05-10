import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'

import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'

import { OrdersGateway } from './gateways/orders.gateway'

@Module({
  imports: [PrismaModule],

  controllers: [OrdersController],

  providers: [
    OrdersService,
    OrdersGateway,
  ],
})
export class OrdersModule {}
