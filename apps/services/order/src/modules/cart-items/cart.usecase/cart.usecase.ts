import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CartService } from '../cart.service/cart.service';
import { CartItem } from '@prisma/client';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Injectable()
export class CartUsecase {
  constructor(
    private readonly cartService: CartService,
    private readonly logger: AppLogger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async upsertCartItems(
    userId: string,
    productId: string,
    storeId: string,
    quantityToAdd: number,
  ): Promise<CartItem | null> {
    this.logger.log(
      `Processing upsert logic for user: ${userId}, product: ${productId}`,
      'CartUsecase',
    );

    const result = await this.cartService.upsertCartItem(
      userId,
      productId,
      storeId,
      quantityToAdd,
    );

    // Invalidate cache
    await this.cacheManager.del(`cart:user:${userId}`);

    return result;
  }

  async getAllMyListCartItems(userId: string): Promise<CartItem[]> {
    const cacheKey = `cart:user:${userId}`;
    const cachedItems = await this.cacheManager.get<CartItem[]>(cacheKey);
    if (cachedItems) {
      return cachedItems;
    }

    this.logger.log(
      `Fetching all cart items for user: ${userId}`,
      'CartUsecase',
    );

    const cartItems = await this.cartService.findAllCartItemsByUserIdAndThrow(userId);
    await this.cacheManager.set(cacheKey, cartItems, 300000); // 5 minutes
    return cartItems;
  }

  async deleteMyCartItem(userId: string, productId: string): Promise<CartItem> {
    this.logger.log(
      `Executing deletion of product: ${productId} from cart for user: ${userId}`,
      'CartUsecase',
    );

    const result = await this.cartService.deleteMyCartItemByProductId(userId, productId);

    // Invalidate cache
    await this.cacheManager.del(`cart:user:${userId}`);

    return result;
  }

  async getTotalPriceFromSelectedCartItems(userId: string): Promise<number> {
    this.logger.log(
      `Calculating total price for selected cart items of user: ${userId}`,
      'CartUsecase',
    );

    const cartItems =
      await this.cartService.findCartItemsByUserAndSelected(userId);

    if (!cartItems || cartItems.length === 0) {
      this.logger.warn(
        `Calculation aborted: No selected cart items found for user: ${userId}`,
        'CartUsecase',
      );

      throw new AppException(
        'No selected items found in the cart',
        HttpStatus.NOT_FOUND,
      );
    }

    const totalPrice = await this.cartService.calculateTotalPrice(cartItems);

    this.logger.log(
      `Total price calculated for user: ${userId}. Final Amount: ${totalPrice}`,
      'CartUsecase',
    );

    return totalPrice;
  }
}
