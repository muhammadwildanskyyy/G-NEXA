import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { EnvConfig } from '../../../config/env.validation';
import { AppLogger } from '../../logger/app.logger';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { Product } from '../../http-clients/product-client/dto/product.dto';

interface ProductGrpcResponse {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  condition: string;
  price: number;
  stock: number;
  isActive: boolean;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  images: string[];
  thumbnail: string;
  specs: Record<string, unknown>;
  tags: string[];
  views: number;
  rating: number;
  createdAt: { seconds: string; nanos: number };
  updatedAt: { seconds: string; nanos: number };
}

@Injectable()
export class ProductGrpcClientService implements OnModuleInit, OnModuleDestroy {
  private client: any;
  private readonly grpcUrl: string;

  constructor(
    private readonly config: ConfigService<EnvConfig, true>,
    private readonly logger: AppLogger,
  ) {
    this.grpcUrl =
      this.config.get('PRODUCT_GRPC_URL', { infer: true }) ||
      'product-service:50051';
  }

  onModuleInit() {
    const protoPath = path.resolve(
      process.cwd(),
      'proto/product.proto',
    );

    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;

    this.client = new proto.products.ProductService(
      this.grpcUrl,
      grpc.credentials.createInsecure(),
    );

    this.logger.info(
      'infra:product-grpc',
      `gRPC client connected to ${this.grpcUrl}`,
    );
  }

  onModuleDestroy() {
    if (this.client) {
      grpc.closeClient(this.client);
    }
  }

  /**
   * Get product by ID via gRPC and return in the same shape
   * as the existing HTTP client DTO (snake_case).
   */
  async getProductById(productId: string): Promise<Product> {
    const grpcResponse = await this.callGetProduct(productId);
    return this.toProductDto(grpcResponse);
  }

  private callGetProduct(productId: string): Promise<ProductGrpcResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.client.getProduct(
        { id: productId },
        (err: grpc.ServiceError | null, response: ProductGrpcResponse) => {
          const latency = `${Date.now() - startTime}ms`;

          if (err) {
            this.logger.err(
              'infra:product-grpc',
              'gRPC GetProduct failed',
              err,
              { productId, latency },
            );
            reject(
              new AppException(
                err.details || 'Product not found',
                err.code === grpc.status.NOT_FOUND ? 404 : 500,
              ),
            );
            return;
          }

          this.logger.dbg(
            'infra:product-grpc',
            'gRPC GetProduct succeeded',
            { productId, latency },
          );
          resolve(response);
        },
      );
    });
  }

  /** Convert gRPC camelCase response to snake_case Product DTO */
  private toProductDto(resp: ProductGrpcResponse): Product {
    const product = new Product();
    product.id = resp.id;
    product.store_id = resp.storeId;
    product.category_id = resp.categoryId;
    product.name = resp.name;
    product.slug = resp.slug;
    product.description = resp.description;
    product.condition = resp.condition;
    product.price = resp.price;
    product.stock = resp.stock;
    product.is_active = resp.isActive;
    product.weight = resp.weight;
    product.dimensions = resp.dimensions;
    product.images = resp.images;
    product.thumbnail = resp.thumbnail;
    product.specs = resp.specs || {};
    product.tags = resp.tags;
    product.views = resp.views;
    product.rating = resp.rating;
    if (resp.createdAt) {
      product.created_at = new Date(Number(resp.createdAt.seconds) * 1000);
    }
    if (resp.updatedAt) {
      product.updated_at = new Date(Number(resp.updatedAt.seconds) * 1000);
    }
    return product;
  }
}
