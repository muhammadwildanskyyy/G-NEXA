import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppLogger } from '../../../infrastructure/logger/app.logger';
import { CartItem, Prisma } from '@prisma/client';

@Injectable()
export class CartRepository {
  constructor(
    private readonly database: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async upsertCartItemWithTransaction(
    userId: string,
    productId: string,
    storeId: string,
    quantityToAdd: number,
  ): Promise<CartItem | null> {
    return this.database.$transaction(async (tx) => {
      const existingItem = await tx.cartItem.findFirst({
        where: {
          user_id: userId,
          product_id: productId,
        },
      });

      if (!existingItem) {
        if (quantityToAdd < 0) {
          throw new Error('Barang tidak ditemukan di keranjang');
        }

        return tx.cartItem.create({
          data: {
            user_id: userId,
            product_id: productId,
            store_id: storeId,
            quantity: quantityToAdd,
          },
        });
      }

      const newQuantity = existingItem.quantity + quantityToAdd;

      if (newQuantity <= 0) {
        await tx.cartItem.delete({
          where: {
            id: existingItem.id,
          },
        });

        return null;
      }

      return tx.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
      });
    });
  }

  async insertCartItem(
    cartInput: Prisma.CartItemCreateInput,
  ): Promise<CartItem> {
    return this.database.cartItem.create({ data: cartInput });
  }

  async updateCartItem(
    cartInput: Prisma.CartItemUpdateInput,
    cartId: string,
  ): Promise<CartItem> {
    return this.database.cartItem.update({
      where: { id: cartId },
      data: cartInput,
    });
  }

  async deleteCartItem(cartId: string): Promise<CartItem> {
    return this.database.cartItem.delete({ where: { id: cartId } });
  }

  async selectCartItems(): Promise<CartItem[]> {
    return this.database.cartItem.findMany();
  }

  async selectCartItemsByProductId(
    productId: string,
  ): Promise<CartItem | null> {
    return this.database.cartItem.findFirst({
      where: { product_id: productId },
    });
  }

  async selectCartItemByID(cartId: string): Promise<CartItem | null> {
    return this.database.cartItem.findFirst({ where: { id: cartId } });
  }

  async selectOneCartItemByUserId(userId: string): Promise<CartItem | null> {
    return this.database.cartItem.findFirst({ where: { user_id: userId } });
  }

  async selectAllCartItemByUserId(userId: string): Promise<CartItem[]> {
    return this.database.cartItem.findMany({ where: { user_id: userId } });
  }

  async selectCartItemByUserAndProductId(
    userId: string,
    productId: string,
  ): Promise<CartItem | null> {
    return this.database.cartItem.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
      },
    });
  }
}
