import { Test, TestingModule } from '@nestjs/testing';
import { PizzaSizesService } from './pizza-sizes.service';

describe('PizzaSizesService', () => {
  let service: PizzaSizesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PizzaSizesService],
    }).compile();

    service = module.get<PizzaSizesService>(PizzaSizesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
