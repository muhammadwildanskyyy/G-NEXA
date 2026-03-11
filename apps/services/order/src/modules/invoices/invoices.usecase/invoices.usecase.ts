import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OrdersService } from '../../orders/orders.service/orders.service';
import { CreateInvoiceDto, InvoiceEventPayload, KAFKA_ORDER_TOPIC, UpdateInvoiceDto } from '../../orders/dto/order.dto';
import { Invoice, Order, Prisma, OrderStatus } from '@prisma/client';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { AppLogger } from '../../../infrastructure/logger/app.logger';
import { ClientKafka } from '@nestjs/microservices';
import { CartService } from '../../cart-items/cart.service/cart.service';
import { InvoicesService } from '../invoices.service/invoices.service';

@Injectable()
export class InvoicesUsecase implements OnModuleInit {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
    private readonly logger: AppLogger,
    @Inject('KAFKA_PRODUCER') private readonly kafkaClient: ClientKafka,
  ) { }

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.info(
        'INFRA:KAFKA',
        '✅ Kafka Producer connected and ready to emit events from Invoice Usecase',
      );
    } catch (error) {
      this.logger.err(
        'INFRA:KAFKA',
        '❌ Failed to Connect Kafka Producer in Invoice Usecase',
        error,
      );
    }
  }

  async checkoutOrders(
    userId: string,
    params: CreateInvoiceDto,
  ): Promise<Invoice & { orders: Order[] }> {
    this.logger.info('usecase:invoice', 'Initiating multi-store checkout process', {
      user_id: userId,
      idempotency_key: params.idempotensi_Key,
      store_count: params.orders.length,
    });

    // 1. Validasi Idempotency
    const isIdempotencyExist = await this.invoicesService.checkIdempotency(
      params.idempotensi_Key,
    );
    if (isIdempotencyExist) {
      this.logger.warning(
        'usecase:invoice',
        'Checkout failed: Idempotency Key already exists',
        { idempotency_key: params.idempotensi_Key },
      );
      throw new AppException(
        'Idempotensi Key Already Exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    let globalTotalPrice = 0;
    const storeOrdersData: {
      storeId: string;
      totalPrice: number;
      items: Prisma.OrderItemCreateWithoutOrderInput[];
    }[] = [];

    // 2. Validasi per Toko dan Produk
    for (const storeOrder of params.orders) {
      // Validasi Store
      const isValidStore = await this.ordersService.getStoreById(storeOrder.store_id);
      if (!isValidStore) {
        this.logger.warning('usecase:invoice', 'Checkout failed: Invalid store', {
          store_id: storeOrder.store_id,
        });
        throw new AppException('Store Invalid', HttpStatus.BAD_REQUEST);
      }

      // Validasi Product & Stock
      const products = await this.ordersService.getValidProduct(storeOrder);
      if (!products) {
        this.logger.warning(
          'usecase:invoice',
          'Checkout failed: Product validation returned empty for store',
          { store_id: storeOrder.store_id }
        );
        throw new AppException(`Product Invalid`, HttpStatus.BAD_REQUEST);
      }

      // Kalkulasi Harga
      const { orderItems, totalAmount } = this.ordersService.constructOrderItems(
        products,
        storeOrder,
      );

      globalTotalPrice += totalAmount;

      storeOrdersData.push({
        storeId: storeOrder.store_id,
        totalPrice: totalAmount,
        items: orderItems,
      });
    }

    // 3. Eksekusi Simpan di Transaksi
    const savedInvoice = await this.invoicesService.createInvoiceTransaction(
      userId,
      params.idempotensi_Key,
      globalTotalPrice,
      { ...params.shipping_address },
      storeOrdersData,
    );

    // 4. Update Cart (Kurangi stok yang di checkout)
    for (const storeOrder of storeOrdersData) {
      for (const item of storeOrder.items) {
        await this.cartService.upsertCartItem(
          userId,
          item.product_id,
          storeOrder.storeId,
          -item.quantity,
        );
      }
    }

    // 5. Emit Event Kafka
    const payloadEvent: InvoiceEventPayload = {
      event: 'invoice.created',
      timestamp: new Date().toISOString(),
      data: {
        invoice_id: savedInvoice.id,
        total_amount: Number(savedInvoice.total_price),
        order_ids: savedInvoice.orders.map((o) => o.id),
      },
    };

    this.kafkaClient.emit(KAFKA_ORDER_TOPIC, {
      key: savedInvoice.id, // Partition key berdasarkan invoice_id
      value: payloadEvent,
    });

    this.logger.info(
      'usecase:invoice',
      'Invoice checkout orchestrated successfully',
      { invoice_id: savedInvoice.id, order_count: savedInvoice.orders.length },
    );

    return savedInvoice;
  }

  async findInvoicesByUserId(userId: string): Promise<Invoice[]> {
    this.logger.dbg('usecase:invoice', 'Fetching invoices for user', {
      user_id: userId,
    });
    const invoices = await this.invoicesService.findInvoicesByUserId(userId);
    if (!invoices || invoices.length === 0) {
      this.logger.warning('usecase:invoice', 'Invoices not found for user', {
        user_id: userId,
      });
      throw new AppException('Invoice Not Found', HttpStatus.NOT_FOUND);
    }
    return invoices;
  }

  async findAllInvoices(): Promise<Invoice[]> {
    this.logger.dbg('usecase:invoice', 'Fetching all invoices');
    const invoices = await this.invoicesService.findAllInvoices();
    if (!invoices || invoices.length === 0) {
      this.logger.warning('usecase:invoice', 'No invoices found in database');
      throw new AppException('Invoice Not Found', HttpStatus.NOT_FOUND);
    }
    return invoices;
  }

  async findInvoiceById(invoiceId: string): Promise<Invoice> {
    this.logger.dbg('usecase:invoice', 'Fetching invoice by ID', {
      invoice_id: invoiceId,
    });
    const invoice = await this.invoicesService.findInvoiceById(invoiceId);
    if (!invoice) {
      this.logger.warning('usecase:invoice', 'Invoice not found', {
        invoice_id: invoiceId,
      });
      throw new AppException('Invoice Not Found', HttpStatus.NOT_FOUND);
    }
    return invoice;
  }

  async updateInvoice(
    invoiceId: string,
    params: UpdateInvoiceDto,
  ): Promise<Invoice> {
    this.logger.dbg('usecase:invoice', 'Orchestrating invoice update', {
      invoice_id: invoiceId,
    });

    const invoice = await this.invoicesService.findInvoiceById(invoiceId);
    if (!invoice) {
      this.logger.warning('usecase:invoice', 'Update failed: Invoice not found', {
        invoice_id: invoiceId,
      });
      throw new AppException('Invoice Not Found', HttpStatus.NOT_FOUND);
    }

    const updatedInvoice = await this.invoicesService.updateInvoice(
      invoiceId,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      params,
    );
    this.logger.info(
      'usecase:invoice',
      'Invoice update orchestrated successfully',
      { invoice_id: invoiceId },
    );

    return updatedInvoice;
  }

  async deleteInvoice(invoiceId: string): Promise<Invoice> {
    this.logger.dbg('usecase:invoice', 'Orchestrating invoice deletion', {
      invoice_id: invoiceId,
    });

    const invoice = await this.invoicesService.findInvoiceById(invoiceId);
    if (!invoice) {
      this.logger.warning('usecase:invoice', 'Deletion failed: Invoice not found', {
        invoice_id: invoiceId,
      });
      throw new AppException('Invoice Not Found', HttpStatus.NOT_FOUND);
    }

    const deletedInvoice = await this.invoicesService.deleteInvoice(
      invoiceId,
    );
    this.logger.info(
      'usecase:invoice',
      'Invoice deletion orchestrated successfully',
      { invoice_id: invoiceId },
    );

    return deletedInvoice;
  }
}
