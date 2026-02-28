import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { als } from '../../../infrastructure/logger/als';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(request: Request, response: Response, next: NextFunction): void {
    // 1. Inisialisasi Trace ID & ALS (AsyncLocalStorage)
    const correlationHeader = request.headers['x-correlation-id'];
    let traceId: string;

    if (typeof correlationHeader === 'string') {
      traceId = correlationHeader;
    } else if (
      Array.isArray(correlationHeader) &&
      correlationHeader.length > 0
    ) {
      traceId = String(correlationHeader[0]);
    } else {
      traceId = randomUUID();
    }

    response.setHeader('X-Correlation-ID', traceId);

    const store = new Map<string, string>();
    store.set('trace_id', traceId);

    // 2. Jalankan request di dalam Scope ALS
    als.run(store, () => {
      const { ip, method, originalUrl } = request;
      const userAgent = request.get('user-agent') || 'unknown';
      const startTime = Date.now();

      // Log saat request baru masuk
      this.logger.info('delivery:http', 'Incoming HTTP request', {
        method: String(method),
        path: String(originalUrl),
        ip: ip ? String(ip) : 'unknown',
        user_agent: String(userAgent),
      });

      // Log saat request selesai dikerjakan (baik sukses maupun error)
      response.on('finish', () => {
        const { statusCode } = response;
        const contentLength = response.get('content-length') || '0';
        const duration = Date.now() - startTime;

        // Kumpulkan metadata dalam bentuk Objek, bukan String yang digabung
        const meta: Record<string, unknown> = {
          method: String(method),
          path: String(originalUrl),
          status: Number(statusCode),
          content_length: Number(contentLength),
          latency: `${duration}ms`,
        };

        if (statusCode >= 400) {
          this.logger.warning(
            'delivery:http',
            'HTTP request finished with error',
            meta,
          );
        } else {
          this.logger.info(
            'delivery:http',
            'HTTP request completed successfully',
            meta,
          );
        }
      });

      // Lanjutkan ke Controller
      next();
    });
  }
}
