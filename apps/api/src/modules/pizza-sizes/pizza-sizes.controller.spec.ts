import { Test, TestingModule } from '@nestjs/testing';
import { PizzaSizesController } from './pizza-sizes.controller';

describe('PizzaSizesController', () => {
  let controller: PizzaSizesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PizzaSizesController],
    }).compile();

    controller = module.get<PizzaSizesController>(PizzaSizesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
