import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'

import { BorderPricesService } from './border-prices.service'
import { BorderPricesController } from './border-prices.controller'

@Module({
  imports: [PrismaModule],
  controllers: [BorderPricesController],
  providers: [BorderPricesService],
})
export class BorderPricesModule {}
