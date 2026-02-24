import { Test, TestingModule } from '@nestjs/testing';
import { OrdersUsecase } from './orders.usecase';

describe('OrdersUsecase', () => {
  let provider: OrdersUsecase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersUsecase],
    }).compile();

    provider = module.get<OrdersUsecase>(OrdersUsecase);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
