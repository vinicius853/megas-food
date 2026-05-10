import { Module } from '@nestjs/common'

import { PrismaModule } from '../../prisma/prisma.module'

import { PizzaFlavorsService } from './pizza-flavors.service'
import { PizzaFlavorsController } from './pizza-flavors.controller'

@Module({
  imports: [PrismaModule],

  controllers: [PizzaFlavorsController],

  providers: [PizzaFlavorsService],
})
export class PizzaFlavorsModule {}
