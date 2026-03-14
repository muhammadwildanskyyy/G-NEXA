import { Injectable, LoggerService } from '@nestjs/common';
import { winstonLogger } from './winston.logger';

@Injectable()
export class AppLogger implements LoggerService {
  // Implementasi bawaan NestJS LoggerService
  log(message: unknown, context?: string) {
    winstonLogger.info(String(message), { layer: context || 'APP' });
  }

  error(message: unknown, trace?: string, context?: string) {
    winstonLogger.error(String(message), { layer: context || 'APP', trace });
  }

  warn(message: unknown, context?: string) {
    winstonLogger.warn(String(message), { layer: context || 'APP' });
  }

  debug(message: unknown, context?: string) {
    winstonLogger.debug(String(message), { layer: context || 'APP' });
  }

  // --- GNEXA Custom Helpers ---

  info(layer: string, message: string, meta?: Record<string, unknown>) {
    winstonLogger.info(message, { layer, ...meta });
  }

  warning(layer: string, message: string, meta?: Record<string, unknown>) {
    winstonLogger.warn(message, { layer, ...meta });
  }

  err(
    layer: string,
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>,
  ) {
    // Ekstrak pesan error secara aman (Safe Error Extraction)
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    winstonLogger.error(message, {
      layer,
      error: errorMsg,
      trace: errorStack,
      ...meta,
    });
  }

  dbg(layer: string, message: string, meta?: Record<string, unknown>) {
    winstonLogger.debug(message, { layer, ...meta });
  }
}
