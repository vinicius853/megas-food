import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'

import { MenuManagementController } from './menu-management.controller'
import { MenuManagementService } from './menu-management.service'

@Module({
  imports: [PrismaModule],

  controllers: [MenuManagementController],

  providers: [MenuManagementService],
})
export class MenuManagementModule {}
