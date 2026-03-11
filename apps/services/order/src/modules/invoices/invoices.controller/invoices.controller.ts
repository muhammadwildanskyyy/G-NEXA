import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ZodValidatePipe } from '../../../common/pipe/zod-validate/zod-validate.pipe';
import {
  type CreateInvoiceDto,
  CreateInvoiceDtoSchema,
  type UpdateInvoiceDto,
  UpdateInvoiceSchema,
  GlobalOrderResponse,
} from '../../orders/dto/order.dto';
import { InvoicesUsecase } from '../invoices.usecase/invoices.usecase';
import {
  JwtAuthGuard,
  USER_ROLE,
} from '../../../common/guards/auth/auth.guard';
import { AclGuard } from '../../../common/guards/acl/acl.guard';
import { User } from '../../../common/decorators/user/user.decorator';
import { HttpStatus } from '@nestjs/common';
import { AppLogger } from '../../../infrastructure/logger/app.logger';
import { Invoice } from '@prisma/client';

@Controller('/v1/api/invoice')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
    private readonly invoiceUsecase: InvoicesUsecase,
    private readonly logger: AppLogger,
  ) {}

  @Post('/create')
  async createInvoice(
    @Body(new ZodValidatePipe(CreateInvoiceDtoSchema))
    inputOrder: CreateInvoiceDto,
    @User('user_id') user_id: string,
  ) {
    this.logger.info('controller:invoice', 'Received request to create invoice', {
      user_id,
      idempotency_key: inputOrder.idempotensi_Key,
      store_count: inputOrder.orders.length,
    });

    const result = await this.invoiceUsecase.checkoutOrders(
      user_id,
      inputOrder,
    );

    return {
      meta: {
        message: 'Success Create Invoice and Orders',
        code: HttpStatus.CREATED,
      },
      data: result,
    };
  }

  @Get('/user')
  async getInvoicesByUserId(
    @User('user_id') user_id: string,
  ): Promise<GlobalOrderResponse<Invoice[]>> {
    this.logger.dbg(
      'controller:invoice',
      'Received request to get invoices by user',
      { user_id },
    );

    const result = await this.invoiceUsecase.findInvoicesByUserId(user_id);

    return {
      meta: {
        message: 'Success Get Invoices By User Id',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Get()
  @UseGuards(new AclGuard([USER_ROLE.ADMIN]))
  async getInvoices(): Promise<GlobalOrderResponse<Invoice[]>> {
    this.logger.dbg(
      'controller:invoice',
      'Received request to get all invoices (Admin)',
    );

    const result = await this.invoiceUsecase.findAllInvoices();

    return {
      meta: {
        message: 'Success Get All Invoices',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Get('/:id')
  async getInvoiceById(
    @Param('id') invoiceId: string,
  ): Promise<GlobalOrderResponse<Invoice>> {
    this.logger.dbg('controller:invoice', 'Received request to get invoice by ID', {
      invoice_id: invoiceId,
    });

    const result = await this.invoiceUsecase.findInvoiceById(invoiceId);

    return {
      meta: {
        message: 'Success Get Invoice By Id',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Put('/update/:id')
  @UseGuards(new AclGuard([USER_ROLE.ADMIN]))
  async updateInvoice(
    @Param('id') invoiceId: string,
    @Body(new ZodValidatePipe(UpdateInvoiceSchema)) params: UpdateInvoiceDto,
  ): Promise<GlobalOrderResponse<Invoice>> {
    this.logger.info('controller:invoice', 'Received request to update invoice', {
      invoice_id: invoiceId,
    });

    const result = await this.invoiceUsecase.updateInvoice(invoiceId, params);

    return {
      meta: {
        message: 'Success Update Invoice',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Delete('/delete/:id')
  @UseGuards(new AclGuard([USER_ROLE.ADMIN]))
  async deleteInvoice(
    @Param('id') invoiceId: string,
  ): Promise<GlobalOrderResponse<Invoice>> {
    this.logger.info('controller:invoice', 'Received request to delete invoice', {
      invoice_id: invoiceId,
    });

    const result = await this.invoiceUsecase.deleteInvoice(invoiceId);

    return {
      meta: {
        message: 'Success delete Invoice',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }
}
