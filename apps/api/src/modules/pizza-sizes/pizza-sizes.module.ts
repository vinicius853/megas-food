import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'

import { PizzaSizesController } from './pizza-sizes.controller'
import { PizzaSizesService } from './pizza-sizes.service'

@Module({
  imports: [PrismaModule],
  controllers: [PizzaSizesController],
  providers: [PizzaSizesService],
})
export class PizzaSizesModule {}
