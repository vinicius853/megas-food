import { Test, TestingModule } from '@nestjs/testing';
import { PizzaFlavorsService } from './pizza-flavors.service';

describe('PizzaFlavorsService', () => {
  let service: PizzaFlavorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PizzaFlavorsService],
    }).compile();

    service = module.get<PizzaFlavorsService>(PizzaFlavorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
