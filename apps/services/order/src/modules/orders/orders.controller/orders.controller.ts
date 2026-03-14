import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ZodValidatePipe } from 'src/common/pipe/zod-validate/zod-validate.pipe';
import {
  GlobalOrderResponse,
  type UpdateOrderDto,
  UpdateOrderSchema,
} from '../dto/order.dto';
import { Order } from '@prisma/client';
import { OrdersUsecase } from '../orders.usecase/orders.usecase';
import {
  JwtAuthGuard,
  USER_ROLE,
} from '../../../common/guards/auth/auth.guard';
import { User } from '../../../common/decorators/user/user.decorator';
import { HttpStatusCode } from 'axios';
import { AclGuard } from '../../../common/guards/acl/acl.guard';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Controller('/v1/api/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly orderUsecase: OrdersUsecase,
    private readonly logger: AppLogger, // 🚀 Inject logger di sini
  ) {}

  @Get('/user')
  async getOrderbyUserId(
    @User('user_id') user_id: string,
  ): Promise<GlobalOrderResponse<Order[]>> {
    this.logger.dbg(
      'controller:order',
      'Received request to get orders by user',
      { user_id },
    );

    const result = await this.orderUsecase.findOrderByUserId(user_id);

    return {
      meta: {
        message: 'Success Get Orders By User Id',
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Get('/store')
  @UseGuards(new AclGuard([USER_ROLE.ADMIN, USER_ROLE.SELLER]))
  async getOrdersBySeller(): Promise<GlobalOrderResponse<Order[]>> {
    this.logger.dbg(
      'controller:order',
      'Received request to get orders by seller store',
    );
    // 🚀 console.log(53453534543); telah dihapus

    const result = await this.orderUsecase.findOrdersByOwnerStore();

    return {
      meta: {
        message: 'Success Get Orders By Order Id', // Typo dari kode asli, mungkin mau diganti 'By Store Id'?
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Put('/update/:id')
  @UseGuards(new AclGuard([USER_ROLE.SELLER, USER_ROLE.ADMIN]))
  async updateOrder(
    @Param('id') orderId: string,
    @Body(new ZodValidatePipe(UpdateOrderSchema)) params: UpdateOrderDto,
  ): Promise<GlobalOrderResponse<Order>> {
    this.logger.info('controller:order', 'Received request to update order', {
      order_id: orderId,
    });

    const result = await this.orderUsecase.updateOrder(orderId, params);

    return {
      meta: {
        message: 'Success Update Order',
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Delete('/delete/:id')
  @UseGuards(new AclGuard([USER_ROLE.SELLER, USER_ROLE.ADMIN]))
  async deleteOrder(
    @Param('id') orderId: string,
  ): Promise<GlobalOrderResponse<Order>> {
    this.logger.info('controller:order', 'Received request to delete order', {
      order_id: orderId,
    });

    const result = await this.orderUsecase.deleteOrder(orderId);

    return {
      meta: {
        message: 'Success delete Order',
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Get('/:id')
  async getOrderbyId(
    @Param('id') orderId: string,
  ): Promise<GlobalOrderResponse<Order>> {
    this.logger.dbg('controller:order', 'Received request to get order by ID', {
      order_id: orderId,
    });

    const result = await this.orderUsecase.findOrderById(orderId);

    return {
      meta: {
        message: 'Success Get Orders By Order Id',
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Get()
  @UseGuards(new AclGuard([USER_ROLE.ADMIN]))
  async getOrders(): Promise<GlobalOrderResponse<Order[]>> {
    this.logger.dbg(
      'controller:order',
      'Received request to get all orders (Admin)',
    );

    const result = await this.orderUsecase.findOrders();

    return {
      meta: {
        message: 'Success Get Orders By Order Id', // Typo dari kode asli, mungkin 'All Orders'?
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Put('/:id/complete')
  async completeOrder(
    @Param('id') orderId: string,
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<Order>> {
    this.logger.info('controller:order', 'Received request to complete order', {
      order_id: orderId,
      user_id: userId,
    });

    const result = await this.orderUsecase.completeOrder(orderId, userId);

    return {
      meta: {
        message: 'Success Complete Order',
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Put('/:id/cancel')
  @UseGuards(new AclGuard([USER_ROLE.SELLER]))
  async cancelOrder(
    @Param('id') orderId: string,
  ): Promise<GlobalOrderResponse<Order>> {
    this.logger.info('controller:order', 'Received request to cancel order', {
      order_id: orderId,
    });

    const result = await this.orderUsecase.cancelOrder(orderId);

    return {
      meta: {
        message: 'Success Cancel Order',
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }
}
