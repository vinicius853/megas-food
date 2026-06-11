import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { GenericMenuManagementController } from './generic-menu-management.controller';
import { GenericMenuManagementService } from './generic-menu-management.service';
import { GenericMenuManagementValidator } from './generic-menu-management.validator';
import { GenericMenuManagementWriter } from './generic-menu-management.writer';

@Module({
  imports: [PrismaModule],
  controllers: [GenericMenuManagementController],
  providers: [
    GenericMenuManagementService,
    GenericMenuManagementValidator,
    GenericMenuManagementWriter,
  ],
  exports: [GenericMenuManagementService],
})
export class GenericMenuManagementModule {}
