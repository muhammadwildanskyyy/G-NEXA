import { Test, TestingModule } from '@nestjs/testing';
import { WinstonLoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: WinstonLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WinstonLoggerService],
    }).compile();

    service = module.get<WinstonLoggerService>(WinstonLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
