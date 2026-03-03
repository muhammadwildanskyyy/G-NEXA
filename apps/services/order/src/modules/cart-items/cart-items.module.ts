import { Module } from '@nestjs/common';
import { CartRepository } from './cart.repository/cart.repository';
import { CartUsecase } from './cart.usecase/cart.usecase';
import { CartService } from './cart.service/./cart.service';
import { CartController } from './cart.controller/cart.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.validation';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { HttpClientsModule } from '../../infrastructure/http-clients/http-clients.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: new ConfigService<EnvConfig>().get('SECRET'),
      signOptions: { expiresIn: '60s' },
    }),
    PrismaModule,
    HttpClientsModule,
  ],
  controllers: [CartController],
  providers: [CartRepository, CartUsecase, CartService],
})
export class CartItemsModule {}
