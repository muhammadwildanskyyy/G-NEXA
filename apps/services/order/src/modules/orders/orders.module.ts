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

@Module({
  imports: [
    HttpClientsModule,
    JwtModule.register({
      global: true,
      secret: new ConfigService<EnvConfig>().get('SECRET'),
      signOptions: { expiresIn: '60s' },
    }),
    PrismaModule,
  ],
  providers: [OrdersService, OrdersRepository, OrdersUsecase],
  controllers: [OrdersController],
})
export class OrdersModule {}
