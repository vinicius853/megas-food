import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

import { OrdersService } from './orders.service';
import { OrderNumberingService } from './order-numbering.service';

import { OrdersController } from './orders.controller';

import { OrdersGateway } from './gateways/orders.gateway';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, AuthModule, WhatsAppModule],

  controllers: [OrdersController],

  providers: [OrdersService, OrderNumberingService, OrdersGateway],
  exports: [OrderNumberingService],
})
export class OrdersModule {}
