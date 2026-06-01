import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'

import { DashboardSettingsController } from './dashboard-settings.controller'
import { DashboardSettingsService } from './dashboard-settings.service'

@Module({
  imports: [PrismaModule],
  controllers: [DashboardSettingsController],
  providers: [DashboardSettingsService],
})
export class DashboardSettingsModule {}
