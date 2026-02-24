import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../../config/env.validation';
import { ClsService } from 'nestjs-cls';
import { WinstonLoggerService } from '../../logger/logger.service';
import { AxiosError } from 'axios';
import { ErrProductResponse } from '../product-client/dto/product.dto';
import { catchError, firstValueFrom, retry } from 'rxjs';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { GlobalUserResponse, User } from './dto/user.dto';
import { Store } from './dto/store.dto';

@Injectable()
export class UserClientService implements OnModuleInit {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly cls: ClsService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.baseUrl = this.config.get('USER_SERVICE_URL', { infer: true });
  }

  onModuleInit() {
    const axios = this.httpService.axiosRef;

    axios.interceptors.request.use((config) => {
      config.headers['X-Correlation-ID'] = crypto.randomUUID();
      config.headers['X-Service-Name'] = 'order-service';

      this.logger.log(
        `[Outgoing Request] ${config.method?.toUpperCase()} ${config.url}`,
      );
      return config;
    });

    axios.interceptors.response.use(
      (response) => {
        this.logger.log(
          `[Incoming Response] ${response.config.url} - Status: ${response.status}`,
        );
        return response;
      },

      (error: AxiosError<ErrProductResponse>) => {
        const status = error.response?.status || 500;

        const message = error.response?.data?.meta.message || error.message;

        this.logger.error(
          `[Axios Error] ${error.config?.url} - ${status}: ${message}`,
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
