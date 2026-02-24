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

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrdersRepository,
    private readonly productClient: ProductClientService,
    private readonly userClient: UserClientService,
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
      throw new AppException(
        'Failed Create Order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return newOrder;
  }

  async getValidProduct(params: CreateOrderDto): Promise<Product[]> {
    const items = params.items;
    const products: Product[] = [];

    for (const item of items) {
      const product = await this.productClient.getProductById(item.product_id);
      if (!product) {
        throw new AppException('Product not found', HttpStatus.BAD_REQUEST);
      }

      if (item.quantity > product.stock) {
        throw new AppException(
          `Insufficient stock of products with ID ${item.product_id}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (item.quantity >= 1000) {
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
    const orders = await this.orderRepository.selecOrdersByUserId(userId);
    if (!orders || orders.length === 0) {
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return orders;
  }

  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.selecOrderById(orderId);
    if (!order) {
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  async getOrders(): Promise<Order[]> {
    const orders = await this.orderRepository.selecOrders();
    if (!orders || orders.length === 0) {
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return orders;
  }

  async updateOrder(
    orderId: string,
    updateOrder: UpdateOrderDto,
  ): Promise<Order> {
    const { shipping_address } = updateOrder;
    return this.orderRepository.updateOrder(orderId, { shipping_address });
  }

  async deleteOrder(orderId: string): Promise<Order> {
    return this.orderRepository.deleteOrder(orderId);
  }

  async getUserInfo(): Promise<User> {
    return this.userClient.getUserInfo();
  }

  async getStoreByOwner(): Promise<Store> {
    return this.userClient.getStoreByOwner();
  }
  async getStoreById(storeId: string): Promise<Store> {
    return this.userClient.getStoreById(storeId);
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const inputUpdate: Prisma.OrderUpdateInput = {
      status: OrderStatus.CANCELLED,
    };
    console.log(inputUpdate);
    return await this.orderRepository.updateOrder(orderId, inputUpdate);
  }

  async getOrderByStoreId(storeId: string): Promise<Order[]> {
    const orders = await this.orderRepository.selectOrderByStoreId(storeId);
    if (!orders || !orders.length) {
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return orders;
  }

  //
  // async findOrderById(orderId: string): Promise<Order | null> {
  //   const orders = await this.orderRepository.selecOrderById(orderId);
  //   if (!orders) {
  //     // todo global err
  //     return null;
  //   }
  //   return orders;
  // }
  //
  // async updateOrder(
  //   orderId: string,
  //   orderInput: Prisma.OrderUpdateInput,
  // ): Promise<Order | null> {
  //   const order = await this.orderRepository.selecOrderById(orderId);
  //   if (!order) {
  //     // todo : global err
  //     return null;
  //   }
  //   const newOrder = await this.orderRepository.updateOrder(
  //     order.id,
  //     orderInput,
  //   );
  //   return newOrder;
  // }
  //
  // async deleteOrder(orderId: string): Promise<Order | null> {
  //   const order = await this.orderRepository.selecOrderById(orderId);
  //   if (!order) {
  //     // todo : global err
  //     return null;
  //   }
  //   return await this.orderRepository.deleteOrder(order.id);
  // }
  async isUniqueIdempotensi(idempotencyKey: string): Promise<boolean> {
    return !(await this.orderRepository.selectOrderByIdempotensi(
      idempotencyKey,
    ));
  }
}
