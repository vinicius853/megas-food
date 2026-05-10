import { Test, TestingModule } from '@nestjs/testing';
import { PizzaFlavorsController } from './pizza-flavors.controller';
import { PizzaFlavorsService } from './pizza-flavors.service';

describe('PizzaFlavorsController', () => {
  let controller: PizzaFlavorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PizzaFlavorsController],
      providers: [PizzaFlavorsService],
    }).compile();

    controller = module.get<PizzaFlavorsController>(PizzaFlavorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
