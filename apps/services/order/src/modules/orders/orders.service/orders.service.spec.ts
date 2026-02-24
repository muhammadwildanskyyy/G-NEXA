import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let provider: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService],
    }).compile();

    provider = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
