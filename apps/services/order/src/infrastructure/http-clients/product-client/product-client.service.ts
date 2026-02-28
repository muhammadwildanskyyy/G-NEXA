import { HttpService } from '@nestjs/axios';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom, retry } from 'rxjs';
import { EnvConfig } from '../../../config/env.validation';
import {
  ErrProductResponse,
  GetProductInfoResponse,
  Product,
} from './dto/product.dto';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { ClsService } from 'nestjs-cls';
import { AppLogger } from '../../logger/app.logger';

import { randomUUID } from 'crypto';
import { als } from '../../logger/als';

// 🚀 2. Buat Interface untuk menghindari ESLint unsafe-member-access
interface GnexaAxiosConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

@Injectable()
export class ProductClientService implements OnModuleInit {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly cls: ClsService,
    private readonly logger: AppLogger,
  ) {
    this.baseUrl = this.config.get('PRODUCT_SERVICE_URL', { infer: true });
  }

  onModuleInit() {
    const axios = this.httpService.axiosRef;

    // 🚀 3. Interceptor Request Keluar
    axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const customConfig = config as GnexaAxiosConfig;

      // Teruskan Trace ID, JANGAN buat baru kecuali kosong
      const store = als.getStore();
      const traceId = store?.get('trace_id') || randomUUID();

      customConfig.headers['X-Correlation-ID'] = traceId;
      customConfig.headers['X-Service-Name'] = 'order-service';

      // Titipkan waktu mulai
      customConfig.metadata = { startTime: Date.now() };

      this.logger.dbg(
        'infra:product-client',
        'Sending HTTP request to upstream',
        {
          method: String(customConfig.method).toUpperCase(),
          url: String(customConfig.url),
        },
      );

      return customConfig;
    });

    // 🚀 4. Interceptor Response Masuk
    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const customConfig = response.config as GnexaAxiosConfig;
        const startTime = customConfig.metadata?.startTime;
        const latency = startTime ? `${Date.now() - startTime}ms` : 'unknown';

        this.logger.dbg(
          'infra:product-client',
          'Received HTTP response from upstream',
          {
            status: Number(response.status),
            url: String(customConfig.url),
            latency: latency,
          },
        );

        return response;
      },

      (error: AxiosError<ErrProductResponse>) => {
        const status = error.response?.status || 500;
        const message = error.response?.data?.meta?.message || error.message;

        let latency = 'unknown';
        let url = 'unknown';

        if (error.config) {
          const customConfig = error.config as GnexaAxiosConfig;
          url = String(customConfig.url);
          const startTime = customConfig.metadata?.startTime;
          if (startTime) {
            latency = `${Date.now() - startTime}ms`;
          }
        }

        this.logger.err(
          'infra:product-client',
          'Upstream HTTP request failed',
          error,
          {
            status: status,
            url: url,
            upstream_message: message,
            latency: latency,
          },
        );

        return Promise.reject(error);
      },
    );
  }

  async getProductById(productId: string): Promise<Product> {
    const token: string = this.cls.get('access_token');
    const request$ = this.httpService
      .get<GetProductInfoResponse>(`${this.baseUrl}/v1/product/${productId}`, {
        headers: {
          Authorization: token,
        },
      })
      .pipe(
        retry(2),
        catchError((error: AxiosError<ErrProductResponse>) => {
          if (error.response) {
            throw new AppException(
              error.response.data.meta.message,
              error.response.status,
            );
          }
          throw new AppException('Product Service is unavailable');
        }),
      );

    const response = await firstValueFrom(request$);

    return response.data.data;
  }
}
