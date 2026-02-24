import { Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './logger/logger.service';
import { HttpClientsModule } from './http-clients/http-clients.module';

@Global()
@Module({
  imports: [HttpClientsModule],
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class InfrastructureModule {}
