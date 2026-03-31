import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { EnvConfig } from '../../../config/env.validation';
import { AppLogger } from '../../logger/app.logger';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { User } from '../../http-clients/user-client/dto/user.dto';
import { Store } from '../../http-clients/user-client/dto/store.dto';

interface UserGrpcResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  phoneNumber: string;
  profilePicture: string;
  bio: string;
  createdAt: { seconds: string; nanos: number };
  updatedAt: { seconds: string; nanos: number };
}

interface StoreGrpcResponse {
  id: string;
  name: string;
  description: string;
  status: string;
  isVerified: boolean;
  logoUrl: string;
  coverUrl: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  userId: string;
  createdAt: { seconds: string; nanos: number };
  updatedAt: { seconds: string; nanos: number };
}

@Injectable()
export class UserGrpcClientService implements OnModuleInit, OnModuleDestroy {
  private client: any;
  private readonly grpcUrl: string;

  constructor(
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly logger: AppLogger,
  ) {
    this.grpcUrl =
      this.config.get('USER_GRPC_URL', { infer: true }) ||
      'user-service:50052';
  }

  onModuleInit() {
    const protoPath = path.resolve(
      process.cwd(),
      'proto/user.proto',
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

    this.client = new proto.users.UserService(
      this.grpcUrl,
      grpc.credentials.createInsecure(),
    );

    this.logger.info(
      'infra:user-grpc',
      `gRPC client connected to ${this.grpcUrl}`,
    );
  }

  onModuleDestroy() {
    if (this.client) {
      grpc.closeClient(this.client);
    }
  }

  // ─── Public API (returns DTOs matching HTTP client interface) ───

  async getUserById(userId: string): Promise<User> {
    const grpcResp = await this.callGetUser(userId);
    return this.toUserDto(grpcResp);
  }

  async getStoreById(storeId: string): Promise<Store> {
    const grpcResp = await this.callGetStoreById(storeId);
    return this.toStoreDto(grpcResp);
  }

  async getStoreByOwner(ownerId: string): Promise<Store> {
    const grpcResp = await this.callGetStoreByOwner(ownerId);
    return this.toStoreDto(grpcResp);
  }

  // ─── Private gRPC Calls ───

  private callGetUser(userId: string): Promise<UserGrpcResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      this.client.getUser(
        { userId },
        (err: grpc.ServiceError | null, response: UserGrpcResponse) => {
          const latency = `${Date.now() - startTime}ms`;
          if (err) {
            this.logger.err('infra:user-grpc', 'gRPC GetUser failed', err, {
              userId,
              latency,
            });
            reject(
              new AppException(
                err.details || 'User not found',
                err.code === grpc.status.NOT_FOUND ? 404 : 500,
              ),
            );
            return;
          }
          this.logger.dbg('infra:user-grpc', 'gRPC GetUser succeeded', {
            userId,
            latency,
          });
          resolve(response);
        },
      );
    });
  }

  private callGetStoreById(storeId: string): Promise<StoreGrpcResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      this.client.getStoreById(
        { storeId },
        (err: grpc.ServiceError | null, response: StoreGrpcResponse) => {
          const latency = `${Date.now() - startTime}ms`;
          if (err) {
            this.logger.err(
              'infra:user-grpc',
              'gRPC GetStoreById failed',
              err,
              { storeId, latency },
            );
            reject(
              new AppException(
                err.details || 'Store not found',
                err.code === grpc.status.NOT_FOUND ? 404 : 500,
              ),
            );
            return;
          }
          this.logger.dbg(
            'infra:user-grpc',
            'gRPC GetStoreById succeeded',
            { storeId, latency },
          );
          resolve(response);
        },
      );
    });
  }

  private callGetStoreByOwner(ownerId: string): Promise<StoreGrpcResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      this.client.getStoreByOwner(
        { ownerId },
        (err: grpc.ServiceError | null, response: StoreGrpcResponse) => {
          const latency = `${Date.now() - startTime}ms`;
          if (err) {
            this.logger.err(
              'infra:user-grpc',
              'gRPC GetStoreByOwner failed',
              err,
              { ownerId, latency },
            );
            reject(
              new AppException(
                err.details || 'Store not found',
                err.code === grpc.status.NOT_FOUND ? 404 : 500,
              ),
            );
            return;
          }
          this.logger.dbg(
            'infra:user-grpc',
            'gRPC GetStoreByOwner succeeded',
            { ownerId, latency },
          );
          resolve(response);
        },
      );
    });
  }

  // ─── DTO Mappers (gRPC camelCase → snake_case DTO) ───

  private toUserDto(resp: UserGrpcResponse): User {
    const user = new User();
    user.id = resp.id;
    user.full_name = resp.fullName;
    user.email = resp.email;
    user.role = resp.role as any;
    user.phone_number = resp.phoneNumber;
    user.profile_picture = resp.profilePicture;
    user.bio = resp.bio;
    if (resp.createdAt) {
      user.created_at = new Date(Number(resp.createdAt.seconds) * 1000);
    }
    if (resp.updatedAt) {
      user.updated_at = new Date(Number(resp.updatedAt.seconds) * 1000);
    }
    return user;
  }

  private toStoreDto(resp: StoreGrpcResponse): Store {
    const store = new Store();
    store.id = resp.id;
    store.name = resp.name;
    store.description = resp.description;
    store.status = resp.status as any;
    store.is_verified = resp.isVerified;
    store.logo_url = resp.logoUrl;
    store.cover_url = resp.coverUrl;
    store.address = resp.address;
    store.city = resp.city;
    store.province = resp.province;
    store.postal_code = resp.postalCode;
    store.latitude = resp.latitude;
    store.longitude = resp.longitude;
    store.user_id = resp.userId;
    if (resp.createdAt) {
      store.created_at = new Date(Number(resp.createdAt.seconds) * 1000);
    }
    if (resp.updatedAt) {
      store.updated_at = new Date(Number(resp.updatedAt.seconds) * 1000);
    }
    return store;
  }
}
