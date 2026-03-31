import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { EnvConfig } from '../../../config/env.validation';
import { AppLogger } from '../../logger/app.logger';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { ClsService } from 'nestjs-cls';
import {
  WalletResponse,
  PaymentResponse,
} from '../../http-clients/finance-client/finance-client.service';

interface WalletGrpcResponse {
  id: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  status: string;
  createdAt: { seconds: string; nanos: number };
  updatedAt: { seconds: string; nanos: number };
}

interface PaymentGrpcItem {
  id: string;
  userId: string;
  transactionId: string;
  transactionType: string;
  xenditPaymentReqId: string;
  amount: number;
  currency: string;
  methodType: string;
  channelCode: string;
  paymentActionInfo: string;
  status: string;
  expiresAt: { seconds: string; nanos: number };
  paidAt: { seconds: string; nanos: number } | null;
  createdAt: { seconds: string; nanos: number };
  updatedAt: { seconds: string; nanos: number };
}

interface PaymentsGrpcResponse {
  payments: PaymentGrpcItem[];
}

@Injectable()
export class FinanceGrpcClientService implements OnModuleInit, OnModuleDestroy {
  private client: any;
  private readonly grpcUrl: string;

  constructor(
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly logger: AppLogger,
    private readonly cls: ClsService,
  ) {
    this.grpcUrl =
      this.config.get('FINANCE_GRPC_URL', { infer: true }) ||
      'finance-service:50053';
  }

  onModuleInit() {
    const protoPath = path.resolve(
      process.cwd(),
      'proto/finance.proto',
    );

    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [path.resolve(process.cwd(), 'proto')],
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;

    this.client = new proto.finance.FinanceService(
      this.grpcUrl,
      grpc.credentials.createInsecure(),
    );

    this.logger.info(
      'infra:finance-grpc',
      `gRPC client connected to ${this.grpcUrl}`,
    );
  }

  onModuleDestroy() {
    if (this.client) {
      grpc.closeClient(this.client);
    }
  }

  // ─── Public API (matches HTTP client interface) ───

  /**
   * Get the current user's wallet via gRPC.
   * Extracts user_id from CLS (set by auth guard).
   */
  async getMyWallet(): Promise<WalletResponse> {
    const userId: string = this.cls.get('user_id');
    const grpcResp = await this.callGetWallet(userId);
    return this.toWalletDto(grpcResp);
  }

  /**
   * Get the current user's payments via gRPC.
   */
  async getMyPayments(): Promise<PaymentResponse[]> {
    const userId: string = this.cls.get('user_id');
    const grpcResp = await this.callGetPayments(userId);
    return (grpcResp.payments || []).map((p) => this.toPaymentDto(p));
  }

  /**
   * Check if the current user has any pending payments.
   */
  async hasPendingPayment(): Promise<boolean> {
    const payments = await this.getMyPayments();
    return payments.some((payment) => payment.status === 'PENDING');
  }

  // ─── Private gRPC Calls ───

  private callGetWallet(userId: string): Promise<WalletGrpcResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.client.getWallet(
        { userId },
        (err: grpc.ServiceError | null, response: WalletGrpcResponse) => {
          const latency = `${Date.now() - startTime}ms`;

          if (err) {
            this.logger.err(
              'infra:finance-grpc',
              'gRPC GetWallet failed',
              err,
              { userId, latency },
            );
            reject(
              new AppException(
                err.details || 'Wallet not found',
                err.code === grpc.status.NOT_FOUND ? 404 : 500,
              ),
            );
            return;
          }

          this.logger.dbg(
            'infra:finance-grpc',
            'gRPC GetWallet succeeded',
            { userId, latency },
          );
          resolve(response);
        },
      );
    });
  }

  private callGetPayments(userId: string): Promise<PaymentsGrpcResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.client.getPayments(
        { userId },
        (err: grpc.ServiceError | null, response: PaymentsGrpcResponse) => {
          const latency = `${Date.now() - startTime}ms`;

          if (err) {
            this.logger.err(
              'infra:finance-grpc',
              'gRPC GetPayments failed',
              err,
              { userId, latency },
            );
            reject(
              new AppException(
                err.details || 'Payments not found',
                err.code === grpc.status.NOT_FOUND ? 404 : 500,
              ),
            );
            return;
          }

          this.logger.dbg(
            'infra:finance-grpc',
            'gRPC GetPayments succeeded',
            { userId, latency },
          );
          resolve(response);
        },
      );
    });
  }

  // ─── DTO Mappers (gRPC camelCase → snake_case) ───

  private toWalletDto(resp: WalletGrpcResponse): WalletResponse {
    return {
      id: resp.id,
      user_id: resp.userId,
      available_balance: resp.availableBalance,
      pending_balance: resp.pendingBalance,
      currency: resp.currency,
      status: resp.status,
      created_at: resp.createdAt
        ? new Date(Number(resp.createdAt.seconds) * 1000).toISOString()
        : '',
      updated_at: resp.updatedAt
        ? new Date(Number(resp.updatedAt.seconds) * 1000).toISOString()
        : '',
    };
  }

  private toPaymentDto(resp: PaymentGrpcItem): PaymentResponse {
    return {
      id: resp.id,
      user_id: resp.userId,
      transaction_id: resp.transactionId,
      transaction_type: resp.transactionType,
      xendit_payment_req_id: resp.xenditPaymentReqId,
      amount: resp.amount,
      currency: resp.currency,
      method_type: resp.methodType,
      channel_code: resp.channelCode,
      payment_action_info: resp.paymentActionInfo,
      status: resp.status,
      expires_at: resp.expiresAt
        ? new Date(Number(resp.expiresAt.seconds) * 1000).toISOString()
        : '',
      paid_at: resp.paidAt
        ? new Date(Number(resp.paidAt.seconds) * 1000).toISOString()
        : null,
      created_at: resp.createdAt
        ? new Date(Number(resp.createdAt.seconds) * 1000).toISOString()
        : '',
      updated_at: resp.updatedAt
        ? new Date(Number(resp.updatedAt.seconds) * 1000).toISOString()
        : '',
    };
  }
}
