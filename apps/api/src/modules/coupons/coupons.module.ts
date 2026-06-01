import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'
import { CouponsController } from './coupons.controller'
import { CouponsService } from './coupons.service'
import { PublicCouponsController } from './public-coupons.controller'

@Module({
  imports: [PrismaModule],
  controllers: [CouponsController, PublicCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
