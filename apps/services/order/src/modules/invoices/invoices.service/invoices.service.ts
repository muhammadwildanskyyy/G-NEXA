import { Injectable } from '@nestjs/common';
import { InvoicesRepository } from '../invoices.repository/invoices.repository';
import { Invoice, Order, Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly invoicesRepository: InvoicesRepository) {}

  async checkIdempotency(idempotencyKey: string): Promise<boolean> {
    return this.invoicesRepository.checkIdempotency(idempotencyKey);
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
    return this.invoicesRepository.createInvoiceTransaction(
      userId,
      idempotencyKey,
      totalPrice,
      shippingAddress,
      storeOrders,
    );
  }

  async findInvoicesByUserId(userId: string): Promise<Invoice[] | null> {
    return this.invoicesRepository.findInvoicesByUserId(userId);
  }

  async findAllInvoices(): Promise<Invoice[] | null> {
    return this.invoicesRepository.findAllInvoices();
  }

  async findInvoiceById(invoiceId: string): Promise<Invoice | null> {
    return this.invoicesRepository.findInvoiceById(invoiceId);
  }

  async updateInvoice(
    invoiceId: string,
    data: Prisma.InvoiceUpdateInput,
  ): Promise<Invoice> {
    return this.invoicesRepository.updateInvoice(invoiceId, data);
  }

  async deleteInvoice(invoiceId: string): Promise<Invoice> {
    return this.invoicesRepository.deleteInvoice(invoiceId);
  }
}
