import { HttpStatus, Injectable } from '@nestjs/common';
import { OrdersRepository } from '../orders.repository/orders.repository';
import { StoreOrderDto, UpdateOrderDto } from '../dto/order.dto';
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

  async getValidProduct(params: StoreOrderDto): Promise<Product[]> {
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

  async completeOrder(orderId: string, userId: string) {
    this.logger.dbg('service:order', 'Completing order', { order_id: orderId, user_id: userId });
    const order = await this.orderRepository.findOrderWithInvoiceAndItems(orderId);
    
    if (!order) {
      this.logger.warning('service:order', 'Complete failed: Order not found', { order_id: orderId });
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    
    if (order.user_id !== userId) {
      this.logger.warning('service:order', 'Complete failed: Unauthorized', { order_id: orderId, user_id: userId });
      throw new AppException('Unauthorized to complete this order', HttpStatus.FORBIDDEN);
    }

    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.PAID) {
      this.logger.warning('service:order', 'Complete failed: Invalid status', { order_id: orderId, status: order.status });
      throw new AppException(`Order cannot be completed from status ${order.status}`, HttpStatus.BAD_REQUEST);
    }

    const completed = await this.orderRepository.updateOrder(
      orderId,
      { status: OrderStatus.COMPLETED },
    );
    this.logger.info('service:order', 'Order successfully completed', { order_id: orderId });

    return { ...order, ...completed, items: order.items, invoice: order.invoice };
  }

  async cancelOrder(orderId: string, storeId: string) {
    this.logger.dbg('service:order', 'Cancelling order', { order_id: orderId, store_id: storeId });
    const order = await this.orderRepository.findOrderWithInvoiceAndItems(orderId);

    if (!order) {
      this.logger.warning('service:order', 'Cancel failed: Order not found', { order_id: orderId });
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }

    if (order.store_id !== storeId) {
       this.logger.warning('service:order', 'Cancel failed: Unauthorized store', { order_id: orderId, store_id: storeId, actual_store_id: order.store_id });
       throw new AppException('Unauthorized to cancel this order', HttpStatus.FORBIDDEN);
    }

    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      this.logger.warning('service:order', 'Cancel failed: Invalid status', { order_id: orderId, status: order.status });
      throw new AppException(`Order cannot be cancelled from status ${order.status}`, HttpStatus.BAD_REQUEST);
    }

    const inputUpdate: Prisma.OrderUpdateInput = {
      status: OrderStatus.CANCELLED,
    };

    const cancelled = await this.orderRepository.updateOrder(
      orderId,
      inputUpdate,
    );
    this.logger.info('service:order', 'Order successfully cancelled', {
      order_id: orderId,
    });

    return { ...order, ...cancelled, items: order.items, invoice: order.invoice };
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

  constructOrderItems(
    validProducts: Product[],
    params: StoreOrderDto,
  ): {
    orderItems: Prisma.OrderItemCreateWithoutOrderInput[];
    totalAmount: number;
  } {
    let totalAmount = 0;
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const cartItem of params.items) {
      const realProduct = validProducts.find(
        (p) => p.id === cartItem.product_id,
      );

      if (!realProduct) {
        this.logger.warning(
          'service:order',
          'Item construction failed: Product ID mismatch',
          { product_id: cartItem.product_id },
        );
        throw new AppException(`Product Invalid`, HttpStatus.BAD_REQUEST);
      }

      totalAmount += realProduct.price * cartItem.quantity;

      orderItems.push({
        product_id: cartItem.product_id,
        quantity: cartItem.quantity,
        price_at_purchase: realProduct.price, // Menyimpan harga saat ini (snapshot harga)
      });
    }

    return { orderItems, totalAmount };
  }
}
