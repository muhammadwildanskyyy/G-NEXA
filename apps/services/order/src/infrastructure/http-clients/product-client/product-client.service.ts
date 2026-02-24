import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios'; // 1. Wajib import AxiosError
import { catchError, firstValueFrom, retry } from 'rxjs';
import { EnvConfig } from '../../../config/env.validation';
import {
  ErrProductResponse,
  GetProductInfoResponse,
  Product,
} from './dto/product.dto';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProductClientService implements OnModuleInit {
  private readonly logger = new Logger(ProductClientService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly cls: ClsService,
  ) {
    this.baseUrl = this.config.get('PRODUCT_SERVICE_URL', { infer: true });
  }

  onModuleInit() {
    const axios = this.httpService.axiosRef;

    axios.interceptors.request.use((config) => {
      config.headers['X-Correlation-ID'] = crypto.randomUUID();
      config.headers['X-Service-Name'] = 'order-service';

      this.logger.debug(
        `[Outgoing Request] ${config.method?.toUpperCase()} ${config.url}`,
      );
      return config;
    });

    axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
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

  async getProductById(productId: string): Promise<Product> {
    const token: string = this.cls.get('access_token');
    console.log('Token: ', token);
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
