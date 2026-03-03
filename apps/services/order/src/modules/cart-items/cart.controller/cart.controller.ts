import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/auth/auth.guard';
import { AppLogger } from '../../../infrastructure/logger/app.logger';
import { ZodValidatePipe } from '../../../common/pipe/zod-validate/zod-validate.pipe';
import {
  UpsertCartItemSchema,
  type UpsertCartItemsDto,
} from '../dto/cart-items.dto';
import { GlobalOrderResponse } from '../../orders/dto/order.dto';
import { CartItem } from '@prisma/client';
import { CartUsecase } from '../cart.usecase/cart.usecase';
import { User } from '../../../common/decorators/user/user.decorator';

@Controller('/v1/api/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly cartUsecase: CartUsecase,
    private readonly logger: AppLogger,
  ) {}

  @Get()
  async getMyListCartItems(
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<CartItem[]>> {
    const result = await this.cartUsecase.getAllMyListCartItems(userId);

    return {
      meta: {
        message: 'success get all my cart items',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Post('/upsert')
  async upsertMyCartItems(
    @Body(new ZodValidatePipe(UpsertCartItemSchema)) param: UpsertCartItemsDto,
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<CartItem | null>> {
    const result = await this.cartUsecase.upsertCartItems(
      userId,
      param.product_id,
      param.store_id,
      param.quantity_to_add,
    );

    if (result === null) {
      return {
        meta: {
          code: HttpStatus.OK,
          message: 'Success delete cart items',
        },
        data: null,
      };
    }

    return {
      meta: {
        message: 'success upsert cart Items',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Delete('/:product_id')
  async deleteCartItems(
    @Param('product_id') productId: string,
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<CartItem>> {
    const result = await this.cartUsecase.deleteMyCartItem(userId, productId);

    return {
      meta: {
        message: 'Seccess Delete Cart Items',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Get('/total-price')
  async getTotalPrice(
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<{ total_price: number }>> {
    const result =
      await this.cartUsecase.getTotalPriceFromSelectedCartItems(userId);

    return {
      meta: {
        message: 'Success Get Total Price',
        code: HttpStatus.OK,
      },
      data: {
        total_price: result,
      },
    };
  }
}
