import { HttpStatus, Injectable } from '@nestjs/common';
import { CartService } from '../cart.service/cart.service';
import { CartItem } from '@prisma/client';
import { AppException } from '../../../common/filters/global.exception/app.exception';

@Injectable()
export class CartUsecase {
  constructor(private readonly cartService: CartService) {}

  async upsertCartItems(
    userId: string,
    productId: string,
    storeId: string,
    quantityToAdd: number,
  ): Promise<CartItem | null> {
    return this.cartService.upsertCartItem(
      userId,
      productId,
      storeId,
      quantityToAdd,
    );
  }

  async getAllMyListCartItems(userId: string): Promise<CartItem[]> {
    return this.cartService.findAllCartItemsByUserIdAndThrow(userId);
  }

  async deleteMyCartItem(userId: string, productId: string): Promise<CartItem> {
    return this.cartService.deleteMyCartItemByProductId(userId, productId);
  }
  async getTotalPriceFromSelectedCartItems(userId: string): Promise<number> {
    const cartItems =
      await this.cartService.findCartItemsByUserAndSelected(userId);

    if (!cartItems.length) {
      throw new AppException('Cart Items Not Found', HttpStatus.NOT_FOUND);
    }

    return await this.cartService.calculateTotalPrice(cartItems);
  }
}
