import { Module } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'
import { BillingModule } from '../modules/billing/billing.module'
import { PublicMenuController } from './public-menu.controller'
import { PublicMenuService } from './public-menu.service'

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [PublicMenuController],
  providers: [PublicMenuService],
})
export class PublicMenuModule {}
