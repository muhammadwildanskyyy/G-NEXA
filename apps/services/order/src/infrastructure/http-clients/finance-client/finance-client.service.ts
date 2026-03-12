import { HttpService } from '@nestjs/axios';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom, retry } from 'rxjs';
import { EnvConfig } from '../../../config/env.validation';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { ClsService } from 'nestjs-cls';
import { AppLogger } from '../../logger/app.logger';
import { randomUUID } from 'crypto';
import { als } from '../../logger/als';

interface GnexaAxiosConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

export interface WalletResponse {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentResponse {
  id: string;
  user_id: string;
  transaction_id: string;
  transaction_type: string;
  xendit_payment_req_id: string;
  amount: number;
  currency: string;
  method_type: string;
  channel_code: string;
  payment_action_info: string;
  status: string;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FinanceApiResponse<T> {
  meta: {
    message: string;
    code: number;
  };
  data: T;
}

interface ErrFinanceResponse {
  meta: {
    message: string;
    code: number;
  };
}

@Injectable()
export class FinanceClientService implements OnModuleInit {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly cls: ClsService,
    private readonly logger: AppLogger,
  ) {
    this.baseUrl = this.config.get('FINANCE_SERVICE_URL', { infer: true });
  }

  onModuleInit() {
    const axios = this.httpService.axiosRef;

    axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const customConfig = config as GnexaAxiosConfig;

      const store = als.getStore();
      const traceId = store?.get('trace_id') || randomUUID();

      customConfig.headers['X-Correlation-ID'] = traceId;
      customConfig.headers['X-Service-Name'] = 'order-service';

      customConfig.metadata = { startTime: Date.now() };

      this.logger.dbg(
        'infra:finance-client',
        'Sending HTTP request to upstream',
        {
          method: String(customConfig.method).toUpperCase(),
          url: String(customConfig.url),
        },
      );

      return customConfig;
    });

    axios.interceptors.response.use(
      (response: AxiosResponse) => {
        const customConfig = response.config as GnexaAxiosConfig;
        const startTime = customConfig.metadata?.startTime;
        const latency = startTime ? `${Date.now() - startTime}ms` : 'unknown';

        this.logger.dbg(
          'infra:finance-client',
          'Received HTTP response from upstream',
          {
            status: Number(response.status),
            url: String(customConfig.url),
            latency: latency,
          },
        );

        return response;
      },

      (error: AxiosError<ErrFinanceResponse>) => {
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
          'infra:finance-client',
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

  async getMyWallet(): Promise<WalletResponse> {
    const token: string = this.cls.get('access_token');
    const request$ = this.httpService
      .get<FinanceApiResponse<WalletResponse>>(`${this.baseUrl}/v1/api/wallet`, {
        headers: {
          Authorization: token,
        },
      })
      .pipe(
        retry(2),
        catchError((error: AxiosError<ErrFinanceResponse>) => {
          if (error.response) {
            throw new AppException(
              error.response.data?.meta?.message || 'Finance Service error',
              error.response.status,
            );
          }
          throw new AppException('Finance Service is unavailable');
        }),
      );

    const response = await firstValueFrom(request$);
    

    return response.data.data;
  }

  async getMyPayments(): Promise<PaymentResponse[]> {
    const token: string = this.cls.get('access_token');
    const request$ = this.httpService
      .get<FinanceApiResponse<PaymentResponse[]>>(`${this.baseUrl}/v1/api/payments`, {
        headers: {
          Authorization: token,
        },
      })
      .pipe(
        retry(2),
        catchError((error: AxiosError<ErrFinanceResponse>) => {
          if (error.response) {
            throw new AppException(
              error.response.data?.meta?.message || 'Finance Service error',
              error.response.status,
            );
          }
          throw new AppException('Finance Service is unavailable');
        }),
      );

    const response = await firstValueFrom(request$);
    return response.data.data;
  }

  async hasPendingPayment(): Promise<boolean> {
    const payments = await this.getMyPayments();
    return payments.some((payment) => payment.status === 'PENDING');
  }
}
