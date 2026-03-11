import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller/invoices.controller';
import { InvoicesUsecase } from './invoices.usecase/invoices.usecase';
import { InvoicesService } from './invoices.service/invoices.service';
import { InvoicesRepository } from './invoices.repository/invoices.repository';
import { HttpClientsModule } from '../../infrastructure/http-clients/http-clients.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.validation';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CartItemsModule } from '../cart-items/cart-items.module';
import { OrdersModule } from '../orders/orders.module';
import { logLevel } from 'kafkajs';
import { AppLogger } from '../../infrastructure/logger/app.logger';

const appLogger = new AppLogger();

@Module({
  imports: [
    HttpClientsModule,
    JwtModule.register({
      global: true,
      secret: new ConfigService<EnvConfig>().get('SECRET'),
      signOptions: { expiresIn: '60s' },
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'gnexa-invoice-service-producer',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
            logLevel: logLevel.ERROR,
            logCreator:
              () =>
              ({ level, log: logging }) => {
                if (level === logLevel.ERROR)
                  appLogger.err(
                    'INFRA:KAFKA',
                    logging.message,
                    logging.error,
                    logging,
                  );
                else if (level === logLevel.WARN)
                  appLogger.warning('INFRA:KAFKA', logging.message, logging);
              },
          },
          producer: {
            idempotent: true,
            maxInFlightRequests: 1,
          },
        },
      },
    ]),
    PrismaModule,
    CartItemsModule,
    OrdersModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesUsecase, InvoicesService, InvoicesRepository, AppLogger],
})
export class InvoicesModule {}
