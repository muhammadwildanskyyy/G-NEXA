import { Injectable } from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Injectable()
export class OrdersRepository {
  s;
  constructor(
    private readonly database: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async selecOrdersByUserId(userId: string): Promise<Order[] | null> {
    return await this.database.order.findMany({
      where: {
        user_id: userId,
      },
    });
  }

  async selecOrderById(orderId: string): Promise<Order | null> {
    return await this.database.order.findFirst({
      where: {
        id: orderId,
      },
    });
  }

  async findOrderWithInvoiceAndItems(orderId: string) {
    return await this.database.order.findUnique({
      where: { id: orderId },
      include: {
        invoice: true,
        items: true,
      },
    });
  }

  async selecOrders(): Promise<Order[] | null> {
    return await this.database.order.findMany();
  }

  async selectOrderByStoreId(storeId: string): Promise<Order[] | null> {
    return this.database.order.findMany({
      where: {
        store_id: storeId,
      },
    });
  }

  async updateOrder(
    orderId: string,
    orderInput: Prisma.OrderUpdateInput,
  ): Promise<Order> {
    return this.database.order.update({
      where: { id: orderId },
      data: orderInput,
    });
  }

  async deleteOrder(orderId: string): Promise<Order> {
    return this.database.order.delete({ where: { id: orderId } });
  }
}
