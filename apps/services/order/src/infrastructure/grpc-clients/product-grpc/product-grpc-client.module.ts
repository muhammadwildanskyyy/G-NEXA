import { Module } from '@nestjs/common';
import { ProductGrpcClientService } from './product-grpc-client.service';

@Module({
  providers: [ProductGrpcClientService],
  exports: [ProductGrpcClientService],
})
export class ProductGrpcClientModule {}
