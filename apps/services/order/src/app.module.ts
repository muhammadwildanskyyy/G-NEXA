import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { OrdersModule } from './modules/orders/orders.module';
import { CommonModule } from './common/common.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { HttpLoggerMiddleware } from './common/middleware/logger/logger.middleware';
import { ClsModule } from 'nestjs-cls';
import { CartItemsModule } from './modules/cart-items/cart-items.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ShippingAddressesModule } from './modules/shipping-addresses/shipping-addresses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnv,
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: `redis://${configService.get('REDIS_HOST') || 'redis'}:${configService.get('REDIS_PORT') || '6379'}`,
          password: configService.get('REDIS_PASSWORD') || undefined,
          ttl: 300000, // 5 minutes in milliseconds
        }),
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    OrdersModule,
    CommonModule,
    InfrastructureModule,
    CartItemsModule,
    InvoicesModule,
    ShippingAddressesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
