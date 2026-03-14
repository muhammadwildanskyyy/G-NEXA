import { Test, TestingModule } from '@nestjs/testing';
import { CartRepository } from './cart.repository';

describe('CartRepository', () => {
  let provider: CartRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartRepository],
    }).compile();

    provider = module.get<CartRepository>(CartRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
