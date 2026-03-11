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

// 🚀 Standardized API route prefix (plural noun is best practice for REST)
@Controller('api/v1/carts')
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
    this.logger.log(
      `Received request to fetch cart items for user: ${userId}`,
      'CartController',
    );

    const result = await this.cartUsecase.getAllMyListCartItems(userId);

    this.logger.log(
      `Successfully retrieved ${result.length} cart items for user: ${userId}`,
      'CartController',
    );

    return {
      meta: {
        code: HttpStatus.OK,
        message: 'Successfully retrieved all cart items',
      },
      data: result,
    };
  }

  @Post('/upsert')
  async upsertMyCartItems(
    @Body(new ZodValidatePipe(UpsertCartItemSchema)) param: UpsertCartItemsDto,
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<CartItem | null>> {
    this.logger.log(
      `Received upsert request for product: ${param.product_id}, qty_to_add: ${param.quantity_to_add}`,
      'CartController',
    );

    const result = await this.cartUsecase.upsertCartItems(
      userId,
      param.product_id,
      param.store_id,
      param.quantity_to_add,
    );

    // If result is null, it means the quantity dropped to 0 and the item was removed
    if (result === null) {
      this.logger.log(
        `Cart item removed because quantity reached zero. Product ID: ${param.product_id}`,
        'CartController',
      );

      return {
        meta: {
          code: HttpStatus.OK,
          message: 'Successfully removed item from cart',
        },
        data: null,
      };
    }

    this.logger.log(
      `Successfully upserted cart item. Product ID: ${param.product_id}`,
      'CartController',
    );

    return {
      meta: {
        code: HttpStatus.OK,
        message: 'Successfully upserted cart item',
      },
      data: result,
    };
  }

  @Delete('/:product_id')
  async deleteCartItems(
    @Param('product_id') productId: string,
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<CartItem>> {
    this.logger.log(
      `Received delete request for cart item. Product ID: ${productId}`,
      'CartController',
    );

    const result = await this.cartUsecase.deleteMyCartItem(userId, productId);

    this.logger.log(
      `Successfully deleted cart item. Product ID: ${productId}`,
      'CartController',
    );

    return {
      meta: {
        code: HttpStatus.OK,
        message: 'Successfully deleted cart item', // Fixed typo 'Seccess'
      },
      data: result,
    };
  }

  @Get('/total-price')
  async getTotalPrice(
    @User('user_id') userId: string,
  ): Promise<GlobalOrderResponse<{ total_price: number }>> {
    this.logger.log(
      `Received request to calculate total cart price for user: ${userId}`,
      'CartController',
    );

    const result =
      await this.cartUsecase.getTotalPriceFromSelectedCartItems(userId);

    this.logger.log(
      `Successfully calculated total price: ${result}`,
      'CartController',
    );

    return {
      meta: {
        code: HttpStatus.OK,
        message: 'Successfully calculated total cart price',
      },
      data: {
        total_price: result,
      },
    };
  }
}
