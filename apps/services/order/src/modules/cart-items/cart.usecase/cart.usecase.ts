import { Injectable } from '@nestjs/common';
import { CartService } from '../cart.service/cart.service';
import { CartItem } from '@prisma/client';

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
}
