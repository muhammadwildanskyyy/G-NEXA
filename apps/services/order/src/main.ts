import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './config/env.validation';
import { WinstonLoggerService } from './infrastructure/logger/logger.service';
import { GlobalExceptionFilter } from './common/filters/global.exception/global.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const winstonLogger = new WinstonLoggerService();
  const configService = app.get(ConfigService<EnvConfig, true>);
  const PORT = configService.get('PORT', { infer: true });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();

  winstonLogger.log(`Aplikasi GNEXA berjalan di port ${PORT}`, 'Bootstrap');

  await app.listen(PORT);
}
bootstrap();
