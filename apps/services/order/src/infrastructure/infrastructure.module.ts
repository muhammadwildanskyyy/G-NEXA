import { Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './logger/logger.service';

@Global()
@Module({
  // imports: [HttpClientsModule],
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class InfrastructureModule {}
