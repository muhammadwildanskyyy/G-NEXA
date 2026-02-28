import { HttpStatus, Injectable } from '@nestjs/common';
import { OrdersService } from '../orders.service/orders.service';
import { CreateOrderDto, UpdateOrderDto } from '../dto/order.dto';
import { Order, Prisma } from '@prisma/client';
import { AppException } from 'src/common/filters/global.exception/app.exception';
import { Product } from '../../../infrastructure/http-clients/product-client/dto/product.dto';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Injectable()
export class OrdersUsecase {
  constructor(
    private readonly orderService: OrdersService,
    private readonly logger: AppLogger, // 🚀 Inject Logger di sini
  ) {}

  async checkoutOurder(userId: string, params: CreateOrderDto): Promise<Order> {
    this.logger.info('usecase:order', 'Initiating order checkout process', {
      user_id: userId,
      idempotency_key: params.idempotensi_Key,
      store_id: params.store_id,
    });

    // 1. Validasi Idempotency
    const isUniqueIdempotensi = await this.orderService.isUniqueIdempotensi(
      params.idempotensi_Key,
    );
    if (!isUniqueIdempotensi) {
      this.logger.warning(
        'usecase:order',
        'Checkout failed: Idempotency Key already exists',
        { idempotency_key: params.idempotensi_Key },
      );
      throw new AppException(
        'Idempotensi Key Already Exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Validasi Store
    const IsValidStore = await this.orderService.getStoreById(params.store_id);
    if (!IsValidStore) {
      this.logger.warning('usecase:order', 'Checkout failed: Invalid store', {
        store_id: params.store_id,
      });
      throw new AppException('Store Invalid', HttpStatus.BAD_REQUEST);
    }

    // 3. Validasi Product & Stock
    const product = await this.orderService.getValidProduct(params);
    if (!product) {
      this.logger.warning(
        'usecase:order',
        'Checkout failed: Product validation returned empty',
      );
      throw new AppException(`Product Invalid`, HttpStatus.BAD_REQUEST);
    }

    // 4. Kalkulasi Harga
    const { orderItems, totalAmount } = this.constructOrderItems(
      product,
      params,
    );

    this.logger.dbg('usecase:order', 'Order items constructed', {
      total_amount: totalAmount,
      item_count: orderItems.length,
    });

    // 5. Eksekusi Simpan
    const savedOrder = await this.orderService.saveOrder(
      userId,
      params.idempotensi_Key,
      params.store_id,
      { ...params.shipping_address },
      totalAmount,
      orderItems,
    );

    this.logger.info(
      'usecase:order',
      'Order checkout orchestrated successfully',
      { order_id: savedOrder.id },
    );
    return savedOrder;
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
        this.logger.warning(
          'usecase:order',
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
