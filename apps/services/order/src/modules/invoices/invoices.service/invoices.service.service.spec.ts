import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesServiceService } from './invoices.service.service';

describe('InvoicesServiceService', () => {
  let service: InvoicesServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoicesServiceService],
    }).compile();

    service = module.get<InvoicesServiceService>(InvoicesServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
