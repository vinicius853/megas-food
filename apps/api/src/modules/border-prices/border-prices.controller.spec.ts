import { Test, TestingModule } from '@nestjs/testing';
import { BorderPricesController } from './border-prices.controller';
import { BorderPricesService } from './border-prices.service';

describe('BorderPricesController', () => {
  let controller: BorderPricesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BorderPricesController],
      providers: [BorderPricesService],
    }).compile();

    controller = module.get<BorderPricesController>(BorderPricesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
