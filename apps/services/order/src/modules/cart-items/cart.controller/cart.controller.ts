import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
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
}
