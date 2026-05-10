import { Test, TestingModule } from '@nestjs/testing';
import { PizzaBordersService } from './pizza-borders.service';

describe('PizzaBordersService', () => {
  let service: PizzaBordersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PizzaBordersService],
    }).compile();

    service = module.get<PizzaBordersService>(PizzaBordersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
