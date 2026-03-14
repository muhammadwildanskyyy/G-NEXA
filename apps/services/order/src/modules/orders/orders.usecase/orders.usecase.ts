import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OrdersService } from '../orders.service/orders.service';
import {
  OrderCancelledEventPayload,
  OrderCompletedEventPayload,
  KAFKA_ORDER_TOPIC,
  UpdateOrderDto,
} from '../dto/order.dto';
import { Order, Prisma } from '@prisma/client';
import { AppException } from 'src/common/filters/global.exception/app.exception';
import { Product } from '../../../infrastructure/http-clients/product-client/dto/product.dto';
import { AppLogger } from '../../../infrastructure/logger/app.logger';
import { ClientKafka } from '@nestjs/microservices';
import { CartService } from '../../cart-items/cart.service/cart.service';
import { UserClientService } from 'src/infrastructure/http-clients/user-client/user-client.service';

@Injectable()
export class OrdersUsecase implements OnModuleInit {
  constructor(
    private readonly orderService: OrdersService,
    private readonly logger: AppLogger,
    private readonly cartService: CartService,
    private readonly userService: UserClientService,
    @Inject('KAFKA_PRODUCER') private readonly kafkaClient: ClientKafka,
  ) { }

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

  async completeOrder(orderId: string, userId: string): Promise<Order> {
    this.logger.dbg('usecase:order', 'Orchestrating order completion', {
      order_id: orderId,
      user_id: userId,
    });

    const completedOrderData = await this.orderService.completeOrder(orderId, userId);

    const sellerStore = await this.userService.getStoreById(completedOrderData.store_id);

    const completedEvent: OrderCompletedEventPayload = {
      event: 'order.completed',
      timestamp: new Date().toISOString(),
      data: {
        order_id: completedOrderData.id,
        invoice_id: completedOrderData.invoice_id,
        buyer_id: completedOrderData.user_id,
        seller_id: sellerStore.user_id,
        amount: Number(completedOrderData.total_price),
      },
    };

    this.kafkaClient.emit(KAFKA_ORDER_TOPIC, {
      key: completedOrderData.invoice_id,
      value: completedEvent,
    });

    this.logger.info(
      'usecase:order',
      'Order completion orchestrated & event published successfully',
      { order_id: orderId },
    );

    return completedOrderData as Order;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    this.logger.dbg('usecase:order', 'Orchestrating order cancellation', {
      order_id: orderId,
    });

    const store = await this.orderService.getStoreByOwner();
    if (!store) {
      this.logger.warning(
        'usecase:order',
        'Cancellation failed: Store not found for owner',
      );
      throw new AppException('Store Not Found', HttpStatus.NOT_FOUND);
    }

    const cancelledOrderData = await this.orderService.cancelOrder(orderId, store.id);

    const cancelledEvent: OrderCancelledEventPayload = {
      event: 'order.cancelled',
      timestamp: new Date().toISOString(),
      data: {
        order_id: cancelledOrderData.id,
        invoice_id: cancelledOrderData.invoice_id,
        buyer_id: cancelledOrderData.invoice.user_id, // invoice always has user_id
        user_id: cancelledOrderData.invoice.user_id,
        seller_id: cancelledOrderData.store_id,
        amount: Number(cancelledOrderData.total_price),
        order_ids: [cancelledOrderData.id],
        order_items: cancelledOrderData.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      },
    };

    this.kafkaClient.emit(KAFKA_ORDER_TOPIC, {
      key: cancelledOrderData.invoice_id,
      value: cancelledEvent,
    });

    this.logger.info(
      'usecase:order',
      'Order cancellation orchestrated & event published successfully',
      { order_id: orderId },
    );

    return cancelledOrderData as Order;
  }

}
