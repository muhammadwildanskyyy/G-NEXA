import { HttpStatus, Injectable } from '@nestjs/common';
import { CartRepository } from '../cart.repository/cart.repository';
import { CartItem } from '@prisma/client';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { ProductClientService } from '../../../infrastructure/http-clients/product-client/product-client.service';
import { AppLogger } from '../../../infrastructure/logger/app.logger'; // 🚀 Added Logger

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productClient: ProductClientService,
    private readonly logger: AppLogger, // 🚀 Injected Logger
  ) {}

  async upsertCartItem(
    userId: string,
    productId: string,
    storeId: string,
    quantityToAdd: number,
  ): Promise<CartItem | null> {
    this.logger.log(
      `Upserting cart item for user: ${userId}, product: ${productId}`,
      'CartService',
    );

    const product = await this.productClient.getProductById(productId);

    if (product.store_id !== storeId) {
      this.logger.warn(
        `Store mismatch. Product ${productId} does not belong to store ${storeId}`,
        'CartService',
      );
      throw new AppException(
        'Product does not belong to the specified store',
        HttpStatus.BAD_REQUEST,
      );
    }

    const cartItem = await this.cartRepository.selectCartItemByUserAndProductId(
      userId,
      productId,
    );

    if (cartItem) {
      const projectedQuantity = cartItem.quantity + quantityToAdd;

      if (quantityToAdd > 0) {
        if (projectedQuantity > product.stock) {
          throw new AppException(
            'Insufficient product stock',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        if (projectedQuantity <= 0) {
          this.logger.log(
            `Quantity reached zero or below, removing item ${productId} from cart`,
            'CartService',
          );
          await this.deleteMyCartItemByProductId(userId, productId);
          return null;
        }
      }
    } else {
      if (quantityToAdd < 0) {
        return null;
      }

      if (quantityToAdd > product.stock) {
        throw new AppException(
          'Insufficient product stock',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.cartRepository.upsertCartItemWithTransaction(
      userId,
      productId,
      storeId,
      quantityToAdd,
    );
  }

  async findAllCartItemsByUserIdAndThrow(userId: string): Promise<CartItem[]> {
    const cartItems =
      await this.cartRepository.selectAllCartItemByUserId(userId);
    if (!cartItems || cartItems.length === 0) {
      throw new AppException(
        'Cart is empty or not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return cartItems;
  }

  async findCartItemsByUserAndSelected(userId: string): Promise<CartItem[]> {
    return this.cartRepository.selectCartItemsByUserIdAndSelected(userId);
  }

  async deleteMyCartItemByProductId(
    userId: string,
    productId: string,
  ): Promise<CartItem> {
    const cart = await this.cartRepository.selectCartItemByUserAndProductId(
      userId,
      productId,
    );

    if (!cart) {
      throw new AppException('Cart item not found', HttpStatus.NOT_FOUND);
    }

    this.logger.log(`Deleting cart item ID: ${cart.id}`, 'CartService');
    return this.cartRepository.deleteCartItem(cart.id);
  }

  async calculateTotalPrice(cartItems: CartItem[]): Promise<number> {
    this.logger.log(
      'Calculating total price via Product Service',
      'CartService',
    );
    let totalPrice: number = 0;

    for (const cartItem of cartItems) {
      try {
        const product = await this.productClient.getProductById(
          cartItem.product_id,
        );

        totalPrice += product.price * cartItem.quantity;
      } catch (error) {
        this.logger.error(
          `Failed to fetch price for product ${cartItem.product_id}`,
          error,
          'CartService',
        );
        throw new AppException(
          'Failed to calculate price, product service error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return totalPrice;
  }
}
