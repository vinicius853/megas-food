import { Module } from '@nestjs/common';
import { PizzaBordersService } from './pizza-borders.service';
import { PizzaBordersController } from './pizza-borders.controller';

@Module({
  controllers: [PizzaBordersController],
  providers: [PizzaBordersService],
})
export class PizzaBordersModule {}
