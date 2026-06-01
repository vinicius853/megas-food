import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from '../../prisma/prisma.module'
import { AuditLogsModule } from '../audit-logs/audit-logs.module'

import { BillingController } from './billing.controller'
import { BillingMaintenanceService } from './billing-maintenance.service'
import { BillingService } from './billing.service'
import { MercadoPagoService } from './mercado-pago.service'
import { SubscriptionAccessService } from './subscription-access.service'

@Module({
  imports: [ConfigModule, PrismaModule, AuditLogsModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    BillingMaintenanceService,
    MercadoPagoService,
    SubscriptionAccessService,
  ],
  exports: [BillingService, SubscriptionAccessService],
})
export class BillingModule {}
