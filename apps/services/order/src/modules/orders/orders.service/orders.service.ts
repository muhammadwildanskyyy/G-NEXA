import { HttpStatus, Injectable } from '@nestjs/common';
import { OrdersRepository } from '../orders.repository/orders.repository';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';
import { Product } from '../../../infrastructure/http-clients/product-client/dto/product.dto';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { ProductClientService } from '../../../infrastructure/http-clients/product-client/product-client.service';
import { Order, OrderStatus, Prisma } from '@prisma/client';
import { User } from '../../../infrastructure/http-clients/user-client/dto/user.dto';
import { UserClientService } from '../../../infrastructure/http-clients/user-client/user-client.service';
import { Store } from '../../../infrastructure/http-clients/user-client/dto/store.dto';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrdersRepository,
    private readonly productClient: ProductClientService,
    private readonly userClient: UserClientService,
    private readonly logger: AppLogger, // 🚀 Inject logger di sini
  ) {}

  async saveOrder(
    userId: string,
    idempotencyKey: string,
    storeId: string,
    shippingAddress: Prisma.InputJsonValue,
    totalAmount: number,
    items: Prisma.OrderItemCreateWithoutOrderInput[],
  ): Promise<Order> {
    const newOrder = await this.orderRepository.createOrderWithItems(
      userId,
      idempotencyKey,
      storeId,
      shippingAddress,
      totalAmount,
      items,
    );

    if (!newOrder) {
      this.logger.err(
        'service:order',
        'Failed Create Order: Repository returned empty',
        null,
        { idempotency_key: idempotencyKey },
      );
      throw new AppException(
        'Failed Create Order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.info('service:order', 'Order successfully saved', {
      order_id: newOrder.id,
      store_id: storeId,
    });
    return newOrder;
  }

  async getValidProduct(params: CreateOrderDto): Promise<Product[]> {
    const items = params.items;
    const products: Product[] = [];

    this.logger.dbg('service:order', 'Validating products for order', {
      item_count: items.length,
    });

    for (const item of items) {
      const product = await this.productClient.getProductById(item.product_id);

      if (!product) {
        this.logger.warning(
          'service:order',
          'Product validation failed: Not found',
          { product_id: item.product_id },
        );
        throw new AppException('Product not found', HttpStatus.BAD_REQUEST);
      }

      if (item.quantity > product.stock) {
        this.logger.warning(
          'service:order',
          'Product validation failed: Insufficient stock',
          {
            product_id: item.product_id,
            requested: item.quantity,
            available: product.stock,
          },
        );
        throw new AppException(
          `Insufficient stock of products with ID ${item.product_id}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (item.quantity >= 1000) {
        this.logger.warning(
          'service:order',
          'Product validation failed: Exceeded maximum order limit',
          {
            product_id: item.product_id,
            requested: item.quantity,
          },
        );
        throw new AppException(
          `Product with ID ${item.product_id} is too must to order`,
          HttpStatus.BAD_REQUEST,
        );
      }

      products.push(product);
    }

    return products;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    this.logger.dbg('service:order', 'Fetching orders by user ID', {
      user_id: userId,
    });
    const orders = await this.orderRepository.selecOrdersByUserId(userId);

    if (!orders || orders.length === 0) {
      this.logger.warning('service:order', 'Orders not found for user', {
        user_id: userId,
      });
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return orders;
  }

  async getOrderById(orderId: string): Promise<Order> {
    this.logger.dbg('service:order', 'Fetching order by ID', {
      order_id: orderId,
    });
    const order = await this.orderRepository.selecOrderById(orderId);

    if (!order) {
      this.logger.warning('service:order', 'Order not found', {
        order_id: orderId,
      });
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  async getOrders(): Promise<Order[]> {
    this.logger.dbg('service:order', 'Fetching all orders');
    const orders = await this.orderRepository.selecOrders();

    if (!orders || orders.length === 0) {
      this.logger.warning('service:order', 'No orders found in database');
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return orders;
  }

  async updateOrder(
    orderId: string,
    updateOrder: UpdateOrderDto,
  ): Promise<Order> {
    const { shipping_address } = updateOrder;
    const updated = await this.orderRepository.updateOrder(orderId, {
      shipping_address,
    });

    this.logger.info(
      'service:order',
      'Order shipping address successfully updated',
      { order_id: orderId },
    );
    return updated;
  }

  async deleteOrder(orderId: string): Promise<Order> {
    const deleted = await this.orderRepository.deleteOrder(orderId);
    this.logger.info('service:order', 'Order successfully deleted', {
      order_id: orderId,
    });
    return deleted;
  }

  async getUserInfo(): Promise<User> {
    this.logger.dbg('service:order', 'Fetching user info from user-client');
    return this.userClient.getUserInfo();
  }

  async getStoreByOwner(): Promise<Store> {
    this.logger.dbg(
      'service:order',
      'Fetching store by owner from user-client',
    );
    return this.userClient.getStoreByOwner();
  }

  async getStoreById(storeId: string): Promise<Store> {
    this.logger.dbg('service:order', 'Fetching store by ID from user-client', {
      store_id: storeId,
    });
    return this.userClient.getStoreById(storeId);
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const inputUpdate: Prisma.OrderUpdateInput = {
      status: OrderStatus.CANCELLED,
    };

    // 🚀 Hapus console.log(inputUpdate) dan ganti dengan logger
    const cancelled = await this.orderRepository.updateOrder(
      orderId,
      inputUpdate,
    );
    this.logger.info('service:order', 'Order successfully cancelled', {
      order_id: orderId,
    });

    return cancelled;
  }

  async getOrderByStoreId(storeId: string): Promise<Order[]> {
    this.logger.dbg('service:order', 'Fetching orders by store ID', {
      store_id: storeId,
    });
    const orders = await this.orderRepository.selectOrderByStoreId(storeId);

    if (!orders || !orders.length) {
      this.logger.warning('service:order', 'Orders not found for store', {
        store_id: storeId,
      });
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return orders;
  }

  async isUniqueIdempotensi(idempotencyKey: string): Promise<boolean> {
    this.logger.dbg('service:order', 'Checking idempotency key uniqueness', {
      idempotency_key: idempotencyKey,
    });
    const exists =
      await this.orderRepository.selectOrderByIdempotensi(idempotencyKey);
    return !exists;
  }
}
