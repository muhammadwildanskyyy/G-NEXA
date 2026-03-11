import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OrdersService } from '../orders.service/orders.service';
import {
  UpdateOrderDto,
} from '../dto/order.dto';
import { Order, Prisma } from '@prisma/client';
import { AppException } from 'src/common/filters/global.exception/app.exception';
import { Product } from '../../../infrastructure/http-clients/product-client/dto/product.dto';
import { AppLogger } from '../../../infrastructure/logger/app.logger';
import { ClientKafka } from '@nestjs/microservices';
import { CartService } from '../../cart-items/cart.service/cart.service';

@Injectable()
export class OrdersUsecase implements OnModuleInit {
  constructor(
    private readonly orderService: OrdersService,
    private readonly logger: AppLogger,
    private readonly cartService: CartService,
    @Inject('KAFKA_PRODUCER') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.info(
        'INFRA:KAFKA',
        '✅ Kafka Producer connected and ready to emit events',
      );
    } catch (error) {
      this.logger.err(
        'INFRA:KAFKA',
        '❌ Failed to Connect Kafka Producer',
        error,
      );
    }
  }

  async findOrderByUserId(userId: string): Promise<Order[]> {
    this.logger.dbg('usecase:order', 'Orchestrating find orders by user ID', {
      user_id: userId,
    });
    return this.orderService.getOrdersByUserId(userId);
  }

  async findOrderById(orderId: string): Promise<Order> {
    this.logger.dbg('usecase:order', 'Orchestrating find order by ID', {
      order_id: orderId,
    });
    return this.orderService.getOrderById(orderId);
  }

  async findOrders(): Promise<Order[]> {
    this.logger.dbg('usecase:order', 'Orchestrating find all orders');
    return this.orderService.getOrders();
  }

  async findOrdersByOwnerStore(): Promise<Order[]> {
    this.logger.dbg(
      'usecase:order',
      'Orchestrating find orders by owner store',
    );
    const store = await this.orderService.getStoreByOwner();

    if (!store) {
      this.logger.warning(
        'usecase:order',
        'Failed to find orders: Store not found for owner',
      );
      throw new AppException('Store Not Found', HttpStatus.NOT_FOUND);
    }

    return await this.orderService.getOrderByStoreId(store.id);
  }

  async updateOrder(orderId: string, params: UpdateOrderDto): Promise<Order> {
    this.logger.dbg('usecase:order', 'Orchestrating order update', {
      order_id: orderId,
    });

    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      this.logger.warning('usecase:order', 'Update failed: Order not found', {
        order_id: orderId,
      });
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }

    const updatedOrder = await this.orderService.updateOrder(orderId, params);
    this.logger.info(
      'usecase:order',
      'Order update orchestrated successfully',
      { order_id: orderId },
    );

    return updatedOrder;
  }

  async deleteOrder(orderId: string): Promise<Order> {
    this.logger.dbg('usecase:order', 'Orchestrating order deletion', {
      order_id: orderId,
    });

    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      this.logger.warning('usecase:order', 'Deletion failed: Order not found', {
        order_id: orderId,
      });
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }

    const deletedOrder = await this.orderService.deleteOrder(orderId);
    this.logger.info(
      'usecase:order',
      'Order deletion orchestrated successfully',
      { order_id: orderId },
    );

    return deletedOrder;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    this.logger.dbg('usecase:order', 'Orchestrating order cancellation', {
      order_id: orderId,
    });

    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      this.logger.warning(
        'usecase:order',
        'Cancellation failed: Order not found',
        { order_id: orderId },
      );
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }

    const cancelledOrder = await this.orderService.cancelOrder(orderId);
    this.logger.info(
      'usecase:order',
      'Order cancellation orchestrated successfully',
      { order_id: orderId },
    );

    return cancelledOrder;
  }

}
