import { HttpStatus, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders.service/orders.service';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';
import { Order, Prisma } from '@prisma/client';
import { AppException } from 'src/common/filters/global.exception/app.exception';
import { Product } from '../../../infrastructure/http-clients/product-client/dto/product.dto';

@Injectable()
export class OrdersUsecase {
  constructor(private readonly orderService: OrdersService) {}

  async checkoutOurder(userId: string, params: CreateOrderDto): Promise<Order> {
    const isUniqueIdempotensi = await this.orderService.isUniqueIdempotensi(
      params.idempotensi_Key,
    );
    if (!isUniqueIdempotensi) {
      throw new AppException(
        'Idempotensi Key Already Exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const IsValidStore = await this.orderService.getStoreById(params.store_id);
    if (!IsValidStore) {
      throw new AppException('Store Invalid', HttpStatus.BAD_REQUEST);
    }

    const product = await this.orderService.getValidProduct(params);
    if (!product) {
      throw new AppException(`Product Invalid`, HttpStatus.BAD_REQUEST);
    }

    const { orderItems, totalAmount } = this.constructOrderItems(
      product,
      params,
    );

    return await this.orderService.saveOrder(
      userId,
      params.idempotensi_Key,
      params.store_id,
      { ...params.shipping_address },
      totalAmount,
      orderItems,
    );
  }

  async findOrderByUserId(userId: string): Promise<Order[]> {
    return this.orderService.getOrdersByUserId(userId);
  }

  async findOrderById(orderId: string): Promise<Order> {
    return this.orderService.getOrderById(orderId);
  }
  async findOrders(): Promise<Order[]> {
    return this.orderService.getOrders();
  }

  async findOrdersByOwnerStore(): Promise<Order[]> {
    const store = await this.orderService.getStoreByOwner();
    if (!store) {
      throw new AppException('Store Not Found', HttpStatus.NOT_FOUND);
    }

    return await this.orderService.getOrderByStoreId(store.id);
  }

  async updateOrder(orderId: string, params: UpdateOrderDto): Promise<Order> {
    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return this.orderService.updateOrder(orderId, params);
  }

  async deleteOrder(orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return this.orderService.deleteOrder(orderId);
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      throw new AppException('Order Not Found', HttpStatus.NOT_FOUND);
    }
    return this.orderService.cancelOrder(orderId);
  }

  private constructOrderItems(
    validProducts: Product[],
    params: CreateOrderDto,
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
        throw new AppException(`Product Invalid`, HttpStatus.BAD_REQUEST);
      }
      totalAmount += realProduct.price * cartItem.quantity;

      orderItems.push({
        product_id: cartItem.product_id,
        quantity: cartItem.quantity,
        price_at_purchase: realProduct.price,
      });
    }

    return { orderItems, totalAmount };
  }
}
