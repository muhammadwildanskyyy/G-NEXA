// src/infrastructure/logger/winston.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { winstonInstance } from './winston.config';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = winstonInstance;
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }
}
