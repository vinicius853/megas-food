import { Test, TestingModule } from '@nestjs/testing';
import { FlavorPricesService } from './flavor-prices.service';

describe('FlavorPricesService', () => {
  let service: FlavorPricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlavorPricesService],
    }).compile();

    service = module.get<FlavorPricesService>(FlavorPricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
