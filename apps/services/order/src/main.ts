import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './config/env.validation';
import { GlobalExceptionFilter } from './common/filters/global.exception/global.exception.filter';
import { AppLogger } from './infrastructure/logger/app.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const appLogger = app.get(AppLogger);
  const configService = app.get(ConfigService<EnvConfig, true>);
  const PORT = configService.get('PORT', { infer: true });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();
  await app.listen(PORT);
  appLogger.info('APP', `Order service started on port ${PORT}`);
}
bootstrap();
