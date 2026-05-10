import { Test, TestingModule } from '@nestjs/testing';
import { PizzaBordersController } from './pizza-borders.controller';
import { PizzaBordersService } from './pizza-borders.service';

describe('PizzaBordersController', () => {
  let controller: PizzaBordersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PizzaBordersController],
      providers: [PizzaBordersService],
    }).compile();

    controller = module.get<PizzaBordersController>(PizzaBordersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
