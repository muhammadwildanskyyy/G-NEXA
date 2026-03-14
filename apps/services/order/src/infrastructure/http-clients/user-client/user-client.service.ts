import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../../config/env.validation';
import { ClsService } from 'nestjs-cls';

import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ErrProductResponse } from '../product-client/dto/product.dto';
import { catchError, firstValueFrom, retry } from 'rxjs';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { GlobalUserResponse, User } from './dto/user.dto';
import { Store } from './dto/store.dto';
import { AppLogger } from '../../logger/app.logger';

import { randomUUID } from 'crypto';
import { als } from '../../logger/als';

interface GnexaAxiosConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}
@Injectable()
export class UserClientService implements OnModuleInit {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly cls: ClsService,
    private readonly logger: AppLogger,
  ) {
    this.baseUrl = this.config.get('USER_SERVICE_URL', { infer: true });
  }

  onModuleInit() {
    const axios = this.httpService.axiosRef;

    // 🚀 2. Gunakan interface baru di interceptor request
    axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const customConfig = config as GnexaAxiosConfig; // Safe casting, bukan 'any'

      const store = als.getStore();
      const traceId = store?.get('trace_id') || randomUUID();

      customConfig.headers['X-Correlation-ID'] = traceId;
      customConfig.headers['X-Service-Name'] = 'order-service';

      // Simpan waktu mulai dengan aman
      customConfig.metadata = { startTime: Date.now() };

      this.logger.dbg('infra:user-client', 'Sending HTTP request to upstream', {
        method: String(customConfig.method).toUpperCase(),
        url: String(customConfig.url),
      });

      return customConfig;
    });

    // 🚀 3. Gunakan interface baru di interceptor response
    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const customConfig = response.config as GnexaAxiosConfig;
        const startTime = customConfig.metadata?.startTime;
        const latency = startTime ? `${Date.now() - startTime}ms` : 'unknown';

        this.logger.dbg(
          'infra:user-client',
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

        // Cek jika config ada sebelum di-cast
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
          'infra:user-client',
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

  async getUserInfo(): Promise<User> {
    const token: string = this.cls.get('access_token');
    const request$ = this.httpService
      .get<GlobalUserResponse<User>>(`${this.baseUrl}/v1/api/me`, {
        headers: {
          Authorization: token,
        },
      })
      .pipe(
        retry(2),
        catchError((error: AxiosError<GlobalUserResponse<null>>) => {
          if (error.response) {
            throw new AppException(
              error.response.data.meta.message,
              error.response.status,
            );
          }
          throw new AppException('User Service is unavailable');
        }),
      );

    const response = await firstValueFrom(request$);

    return response.data.data;
  }

  async getStoreByOwner(): Promise<Store> {
    const token: string = this.cls.get('access_token');
    const request$ = this.httpService
      .get<GlobalUserResponse<Store>>(`${this.baseUrl}/v1/api/store/owner`, {
        headers: {
          Authorization: token,
        },
      })
      .pipe(
        retry(2),
        catchError((error: AxiosError<GlobalUserResponse<null>>) => {
          if (error.response) {
            throw new AppException(
              error.response.data.meta.message,
              error.response.status,
            );
          }
          throw new AppException('Store Service is unavailable');
        }),
      );

    const response = await firstValueFrom(request$);

    return response.data.data;
  }

  async getStoreById(storeId: string): Promise<Store> {
    const token: string = this.cls.get('access_token');
    const request$ = this.httpService
      .get<GlobalUserResponse<Store>>(
        `${this.baseUrl}/v1/api/store/${storeId}`,
        {
          headers: {
            Authorization: token,
          },
        },
      )
      .pipe(
        retry(2),
        catchError((error: AxiosError<GlobalUserResponse<null>>) => {
          if (error.response) {
            throw new AppException(
              error.response.data.meta.message,
              error.response.status,
            );
          }
          throw new AppException('Store Service is unavailable');
        }),
      );

    const response = await firstValueFrom(request$);

    return response.data.data;
  }
}
