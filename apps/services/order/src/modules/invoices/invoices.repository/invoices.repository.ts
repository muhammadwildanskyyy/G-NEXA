import { Injectable } from '@nestjs/common';
import { Invoice, Order, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async checkIdempotency(idempotencyKey: string): Promise<boolean> {
    const exist = await this.prisma.invoice.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    return !!exist;
  }

  async createInvoiceTransaction(
    userId: string,
    idempotencyKey: string,
    totalPrice: number,
    shippingAddress: Prisma.InputJsonValue,
    storeOrders: {
      storeId: string;
      totalPrice: number;
      items: Prisma.OrderItemCreateWithoutOrderInput[];
    }[],
  ): Promise<Invoice & { orders: Order[] }> {
    return this.prisma.$transaction(async (tx) => {
      // Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          user_id: userId,
          idempotency_key: idempotencyKey,
          total_price: totalPrice,
          shipping_address: shippingAddress,
          status: 'PENDING',
        },
      });

      // Create Orders
      const orderPromises = storeOrders.map((storeOrder) =>
        tx.order.create({
          data: {
            invoice_id: invoice.id,
            user_id: userId,
            store_id: storeOrder.storeId,
            total_price: storeOrder.totalPrice,
            shipping_address: shippingAddress,
            status: 'PENDING',
            items: {
              create: storeOrder.items,
            },
          },
        }),
      );

      const createdOrders = await Promise.all(orderPromises);

      // Return combined data
      return {
        ...invoice,
        orders: createdOrders,
      };
    });
  }

  async findInvoicesByUserId(userId: string): Promise<Invoice[] | null> {
    return this.prisma.invoice.findMany({
      where: { user_id: userId },
      include: { orders: true },
    });
  }

  async findAllInvoices(): Promise<Invoice[] | null> {
    return this.prisma.invoice.findMany({
      include: { orders: true },
    });
  }

  async findInvoiceById(invoiceId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { orders: true },
    });
  }

  async updateInvoice(
    invoiceId: string,
    data: Prisma.InvoiceUpdateInput,
  ): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data,
    });
  }

  async deleteInvoice(invoiceId: string): Promise<Invoice> {
    return this.prisma.invoice.delete({
      where: { id: invoiceId },
    });
  }
}
