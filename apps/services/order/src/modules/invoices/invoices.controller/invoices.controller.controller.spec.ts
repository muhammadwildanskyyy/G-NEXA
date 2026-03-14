import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesControllerController } from './invoices.controller.controller';

describe('InvoicesControllerController', () => {
  let controller: InvoicesControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesControllerController],
    }).compile();

    controller = module.get<InvoicesControllerController>(InvoicesControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
