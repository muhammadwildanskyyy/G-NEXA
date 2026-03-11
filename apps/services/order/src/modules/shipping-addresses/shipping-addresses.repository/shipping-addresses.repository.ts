import { Injectable } from '@nestjs/common';
import { Prisma, ShippingAddress } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Injectable()
export class ShippingAddressesRepository {
  constructor(
    private readonly database: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async create(data: Prisma.ShippingAddressUncheckedCreateInput): Promise<ShippingAddress> {
    return this.database.shippingAddress.create({
      data,
    });
  }

  async findByUserId(userId: string): Promise<ShippingAddress[]> {
    return this.database.shippingAddress.findMany({
      where: {
        user_id: userId,
      },
      orderBy: [
        { is_primary: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }

  async findById(addressId: string, userId: string): Promise<ShippingAddress | null> {
    return this.database.shippingAddress.findFirst({
      where: {
        id: addressId,
        user_id: userId,
      },
    });
  }

  async update(addressId: string, userId: string, data: Prisma.ShippingAddressUpdateInput): Promise<ShippingAddress> {
    return this.database.shippingAddress.update({
      where: {
        id: addressId,
        user_id: userId,
      },
      data,
    });
  }

  async delete(addressId: string, userId: string): Promise<ShippingAddress> {
    return this.database.shippingAddress.delete({
      where: {
        id: addressId,
        user_id: userId,
      },
    });
  }

  async unsetPrimaryAddress(userId: string): Promise<void> {
    await this.database.shippingAddress.updateMany({
      where: {
        user_id: userId,
        is_primary: true,
      },
      data: {
        is_primary: false,
      },
    });
  }
}
