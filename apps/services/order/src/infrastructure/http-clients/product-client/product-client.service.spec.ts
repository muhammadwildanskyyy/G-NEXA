import { Test, TestingModule } from '@nestjs/testing';
import { ProductClientService } from './product-client.service';

describe('ProductClientService', () => {
  let service: ProductClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductClientService],
    }).compile();

    service = module.get<ProductClientService>(ProductClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
