import { Module } from '@nestjs/common';
import { FinanceGrpcClientService } from './finance-grpc-client.service';

@Module({
  providers: [FinanceGrpcClientService],
  exports: [FinanceGrpcClientService],
})
export class FinanceGrpcClientModule {}
