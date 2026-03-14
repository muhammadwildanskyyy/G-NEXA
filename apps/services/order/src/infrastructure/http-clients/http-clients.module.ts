import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.validation';
import { ProductClientService } from './product-client/product-client.service';
import { UserClientService } from './user-client/user-client.service';
import { FinanceClientService } from './finance-client/finance-client.service';
import * as http from 'node:http';
import { InfrastructureModule } from '../infrastructure.module';

@Global() // Buat global agar tidak perlu di-import berkali-kali
@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      useFactory: (configService: ConfigService<EnvConfig, true>) => ({
        timeout: 5000,
        maxRedirects: 3,
        httpAgent: new http.Agent({ keepAlive: true }),
      }),
    }),
    InfrastructureModule,
  ],
  providers: [ProductClientService, UserClientService, FinanceClientService],
  exports: [ProductClientService, UserClientService, FinanceClientService],
})
export class HttpClientsModule {}

