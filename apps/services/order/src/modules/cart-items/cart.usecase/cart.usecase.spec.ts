import { Test, TestingModule } from '@nestjs/testing';
import { CartUsecase } from './cart.usecase';

describe('CartUsecase', () => {
  let provider: CartUsecase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CartUsecase],
    }).compile();

    provider = module.get<CartUsecase>(CartUsecase);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
