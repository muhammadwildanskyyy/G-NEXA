import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service/orders.service';
import { OrdersRepository } from './orders.repository/orders.repository';
import { OrdersController } from './orders.controller/orders.controller';

import { OrdersUsecase } from './orders.usecase/orders.usecase';
import { HttpClientsModule } from '../../infrastructure/http-clients/http-clients.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.validation';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { logLevel } from 'kafkajs';
import { AppLogger } from '../../infrastructure/logger/app.logger';
import { CartItemsModule } from '../cart-items/cart-items.module';

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
            clientId: 'gnexa-order-service-producer',
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
  ],
  providers: [OrdersService, OrdersRepository, OrdersUsecase],
  controllers: [OrdersController],
})
export class OrdersModule {}
