import { Module } from '@nestjs/common';
import { UserGrpcClientService } from './user-grpc-client.service';

@Module({
  providers: [UserGrpcClientService],
  exports: [UserGrpcClientService],
})
export class UserGrpcClientModule {}
