import { Test, TestingModule } from '@nestjs/testing';
import { FlavorPricesController } from './flavor-prices.controller';

describe('FlavorPricesController', () => {
  let controller: FlavorPricesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlavorPricesController],
    }).compile();

    controller = module.get<FlavorPricesController>(FlavorPricesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
