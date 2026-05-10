import { Test, TestingModule } from '@nestjs/testing';
import { BorderPricesService } from './border-prices.service';

describe('BorderPricesService', () => {
  let service: BorderPricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BorderPricesService],
    }).compile();

    service = module.get<BorderPricesService>(BorderPricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
