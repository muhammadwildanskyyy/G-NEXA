import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './config/env.validation';
import { GlobalExceptionFilter } from './common/filters/global.exception/global.exception.filter';
import { AppLogger } from './infrastructure/logger/app.logger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { logLevel } from 'kafkajs'; // 👈 Wajib di-import

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService<EnvConfig, true>);
  const appLogger = app.get(AppLogger);

  app.useLogger(appLogger);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'order-service',
        brokers: [
          configService.get('KAFKA_BROKER', { infer: true }) ||
            'localhost:9092',
        ],
        logLevel: logLevel.ERROR,

        logCreator: () => {
          return ({ level, log: logging }) => {
            const meta = { ...logging };
            if (level === logLevel.ERROR) {
              appLogger.err(
                'INFRA:KAFKA',
                logging.message,
                logging.error,
                meta,
              );
            } else if (level === logLevel.WARN) {
              appLogger.warning('INFRA:KAFKA', logging.message, meta);
            } else if (level === logLevel.INFO) {
              appLogger.info('INFRA:KAFKA', logging.message, meta);
            } else {
              appLogger.dbg('INFRA:KAFKA', logging.message, meta);
            }
          };
        },
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      },
      consumer: {
        groupId: 'gnexa-order-group',
      },
    },
  });

  // 5. Konfigurasi Global lainnya
  app.useGlobalFilters(new GlobalExceptionFilter(appLogger));
  app.enableShutdownHooks();

  // 6. Jalankan Kafka Consumer dan HTTP Server secara bersamaan
  await app.startAllMicroservices();
  appLogger.info(
    'INFRA:KAFKA',
    '✅ Kafka Consumer connected and listening to topics',
  );

  const PORT = configService.get('PORT', { infer: true });
  await app.listen(PORT);

  appLogger.info('APP', `🚀 Order service started on port ${PORT}`);
}
bootstrap();
