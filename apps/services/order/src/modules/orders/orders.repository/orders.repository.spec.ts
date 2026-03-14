import { Test, TestingModule } from '@nestjs/testing';
import { OrdersRepository } from './orders.repository';

describe('OrdersRepository', () => {
  let provider: OrdersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersRepository],
    }).compile();

    provider = module.get<OrdersRepository>(OrdersRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
