import { HttpStatus, Injectable } from '@nestjs/common';
import { CartRepository } from '../cart.repository/cart.repository';
import { CartItem, Prisma } from '@prisma/client';
import { AppException } from '../../../common/filters/global.exception/app.exception';
import { ProductClientService } from '../../../infrastructure/http-clients/product-client/product-client.service';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productClient: ProductClientService,
  ) {}

  async upsertCartItem(
    userId: string,
    productId: string,
    storeId: string,
    quantityToAdd: number,
  ): Promise<CartItem | null> {
    const storeProducts =
      await this.productClient.getProductsByStoreId(storeId);
    const product = await this.productClient.getProductById(productId);
    const cartItems =
      await this.cartRepository.selectCartItemByUserAndProductId(
        userId,
        productId,
      );

    const isProductBelongToStore = storeProducts.some(
      (product) => product.id === productId,
    );

    if (!isProductBelongToStore) {
      throw new AppException(
        'Product Invalid with store',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (cartItems) {
      const projectedQuantity = cartItems.quantity + quantityToAdd;

      if (quantityToAdd > 0) {
        if (projectedQuantity > product.stock) {
          throw new AppException(
            'Product out of stock',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        if (projectedQuantity <= 0) {
          await this.deleteMyCartItemByProductId(userId, productId);
          return null;
        }
      }
    } else {
      if (quantityToAdd < 0) {
        return null;
      }

      if (quantityToAdd > 0 && quantityToAdd > product.stock) {
        throw new AppException('Product out of stock', HttpStatus.BAD_REQUEST);
      }
    }

    return this.cartRepository.upsertCartItemWithTransaction(
      userId,
      productId,
      storeId,
      quantityToAdd,
    );
  }

  async createCartItem(
    cartInput: Prisma.CartItemCreateInput,
  ): Promise<CartItem> {
    return this.cartRepository.insertCartItem(cartInput);
  }

  async plusQuantityCartItem(
    cartId: string,
    cartItems: CartItem,
    quantity: number,
  ): Promise<CartItem> {
    const inputCartItem: Prisma.CartItemUpdateInput = {
      quantity: cartItems.quantity + quantity,
    };
    return this.cartRepository.updateCartItem(inputCartItem, cartId);
  }

  async reduceQuantityCartItem(
    cartId: string,
    cartItems: CartItem,
    quantity: number,
  ): Promise<CartItem> {
    const inputCartItem: Prisma.CartItemUpdateInput = {
      quantity: cartItems.quantity - quantity,
    };
    return this.cartRepository.updateCartItem(inputCartItem, cartId);
  }

  async findAllCartItemsAndThrow(): Promise<CartItem[]> {
    const cartItems = await this.cartRepository.selectCartItems();
    if (!cartItems.length) {
      throw new AppException('Cart not found', HttpStatus.NOT_FOUND);
    }
    return cartItems;
  }

  async findCartItemByIdAndThrow(cartId: string): Promise<CartItem> {
    const cartItems = await this.cartRepository.selectCartItemByID(cartId);
    if (!cartItems) {
      throw new AppException('Cart Items not found', HttpStatus.NOT_FOUND);
    }
    return cartItems;
  }

  async findAllCartItemsByUserIdAndThrow(userId: string): Promise<CartItem[]> {
    const cartItems =
      await this.cartRepository.selectAllCartItemByUserId(userId);
    if (!cartItems || cartItems.length === 0) {
      throw new AppException('Cart not found', HttpStatus.NOT_FOUND);
    }
    return cartItems;
  }

  async findCartItemsByProductIdAndThrow(productId: string): Promise<CartItem> {
    const cartItems =
      await this.cartRepository.selectCartItemsByProductId(productId);
    if (!cartItems) {
      throw new AppException('Cart not found', HttpStatus.NOT_FOUND);
    }
    return cartItems;
  }

  async findCartItemsByProductId(productId: string): Promise<CartItem | null> {
    return await this.cartRepository.selectCartItemsByProductId(productId);
  }

  async findCartItemsByUserIdAndProductId(
    userId: string,
    productId: string,
  ): Promise<CartItem | null> {
    return this.cartRepository.selectCartItemByUserAndProductId(
      userId,
      productId,
    );
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
      throw new AppException('Cart not found', HttpStatus.NOT_FOUND);
    }

    return this.cartRepository.deleteCartItem(cart.id);
  }

  async calculateTotalPrice(cartItems: CartItem[]): Promise<number> {
    let totalPrice: number = 0;

    for (const cartItem of cartItems) {
      const product = await this.productClient.getProductById(
        cartItem.product_id,
      );

      for (let i = 0; i < cartItem.quantity; i++) {
        totalPrice += product.price;
      }
    }

    return totalPrice;
  }
}
