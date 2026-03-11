import { Injectable } from '@nestjs/common';
import { ShippingAddressesRepository } from '../shipping-addresses.repository/shipping-addresses.repository';
import { ShippingAddress, Prisma } from '@prisma/client';

@Injectable()
export class ShippingAddressesService {
  constructor(
    private readonly repository: ShippingAddressesRepository,
  ) {}

  async create(data: Prisma.ShippingAddressUncheckedCreateInput): Promise<ShippingAddress> {
    return this.repository.create(data);
  }

  async findByUserId(userId: string): Promise<ShippingAddress[]> {
    return this.repository.findByUserId(userId);
  }

  async findById(addressId: string, userId: string): Promise<ShippingAddress | null> {
    return this.repository.findById(addressId, userId);
  }

  async update(addressId: string, userId: string, params: Prisma.ShippingAddressUpdateInput): Promise<ShippingAddress> {
    return this.repository.update(addressId, userId, params);
  }

  async delete(addressId: string, userId: string): Promise<ShippingAddress> {
    return this.repository.delete(addressId, userId);
  }

  async unsetPrimaryAddress(userId: string): Promise<void> {
    return this.repository.unsetPrimaryAddress(userId);
  }
}
