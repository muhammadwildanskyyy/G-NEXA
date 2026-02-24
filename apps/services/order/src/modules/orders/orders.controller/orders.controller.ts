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
  type CreateOrderDto,
  CreateOrderSchema,
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

@Controller('/v1/api/order')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orderUsecase: OrdersUsecase) {}
  @Post('/create')
  async createOrder(
    @Body(new ZodValidatePipe(CreateOrderSchema)) inputOrder: CreateOrderDto,
    @User('user_id') user_id: string,
  ): Promise<GlobalOrderResponse<Order>> {
    const result = await this.orderUsecase.checkoutOurder(user_id, inputOrder);

    return {
      meta: {
        message: 'Success Create Order',
        code: HttpStatusCode.Created,
      },
      data: result,
    };
  }

  @Get('/user')
  async getOrderbyUserId(
    @User('user_id') user_id: string,
  ): Promise<GlobalOrderResponse<Order[]>> {
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
    console.log(53453534543);
    const result = await this.orderUsecase.findOrdersByOwnerStore();
    return {
      meta: {
        message: 'Success Get Orders By Order Id',
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
    const result = await this.orderUsecase.findOrders();
    return {
      meta: {
        message: 'Success Get Orders By Order Id',
        code: HttpStatusCode.Ok,
      },
      data: result,
    };
  }

  @Put('/:id/cancel')
  async cancelOrder(
    @Param('id') orderId: string,
  ): Promise<GlobalOrderResponse<Order>> {
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
