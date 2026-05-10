import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'

import { FlavorPricesController } from './flavor-prices.controller'
import { FlavorPricesService } from './flavor-prices.service'

@Module({
  imports: [PrismaModule],
  controllers: [FlavorPricesController],
  providers: [FlavorPricesService],
})
export class FlavorPricesModule {}
