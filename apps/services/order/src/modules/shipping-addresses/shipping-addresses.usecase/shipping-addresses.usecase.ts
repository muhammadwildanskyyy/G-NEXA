import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ShippingAddressesService } from '../shipping-addresses.service/shipping-addresses.service';
import { CreateShippingAddressDto, UpdateShippingAddressDto } from '../dto/shipping-address.dto';
import { ShippingAddress } from '@prisma/client';
import { AppLogger } from '../../../infrastructure/logger/app.logger';
import { AppException } from '../../../common/filters/global.exception/app.exception';

@Injectable()
export class ShippingAddressesUsecase {
  constructor(
    private readonly service: ShippingAddressesService,
    private readonly logger: AppLogger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: string, params: CreateShippingAddressDto): Promise<ShippingAddress> {
    this.logger.dbg('usecase:shipping-address', 'Orchestrating creation of new shipping address', { user_id: userId });

    const existingAddresses = await this.service.findByUserId(userId);
    
    // If it's the first address, force it to be primary. 
    // Otherwise, if new address is marked as primary, unset other primary addresses.
    let isPrimary = params.is_primary;
    if (existingAddresses.length === 0) {
      isPrimary = true;
    } else if (isPrimary) {
      await this.service.unsetPrimaryAddress(userId);
    }

    const createdAddress = await this.service.create({
      user_id: userId,
      recipient_name: params.recipient_name,
      phone_number: params.phone_number,
      full_address: params.full_address,
      city: params.city,
      province: params.province,
      postal_code: params.postal_code,
      is_primary: isPrimary || false,
    });

    // Invalidate cache
    await this.cacheManager.del(`shipping_addresses:user:${userId}`);

    this.logger.info('usecase:shipping-address', 'Shipping address creation orchestrated successfully', { address_id: createdAddress.id });
    return createdAddress;
  }

  async findByUserId(userId: string): Promise<ShippingAddress[]> {
    const cacheKey = `shipping_addresses:user:${userId}`;
    const cachedAddresses = await this.cacheManager.get<ShippingAddress[]>(cacheKey);
    if (cachedAddresses) {
      return cachedAddresses;
    }

    this.logger.dbg('usecase:shipping-address', 'Orchestrating fetch shipping addresses for user', { user_id: userId });
    const addresses = await this.service.findByUserId(userId);
    await this.cacheManager.set(cacheKey, addresses, 300000); // 5 minutes
    return addresses;
  }

  async findById(addressId: string, userId: string): Promise<ShippingAddress> {
    const cacheKey = `shipping_address:id:${addressId}`;
    const cachedAddress = await this.cacheManager.get<ShippingAddress>(cacheKey);
    if (cachedAddress) {
      return cachedAddress;
    }

    this.logger.dbg('usecase:shipping-address', 'Orchestrating fetch shipping address by ID', { address_id: addressId, user_id: userId });
    
    const address = await this.service.findById(addressId, userId);
    if (!address) {
      this.logger.warning('usecase:shipping-address', 'Shipping address not found', { address_id: addressId, user_id: userId });
      throw new AppException('Shipping Address Not Found', HttpStatus.NOT_FOUND);
    }

    await this.cacheManager.set(cacheKey, address, 300000); // 5 minutes
    return address;
  }

  async update(addressId: string, userId: string, params: UpdateShippingAddressDto): Promise<ShippingAddress> {
    this.logger.info('usecase:shipping-address', 'Orchestrating update shipping address', { address_id: addressId, user_id: userId });
    
    await this.findById(addressId, userId); // Ensure it exists

    if (params.is_primary) {
      await this.service.unsetPrimaryAddress(userId);
    }

    const updated = await this.service.update(addressId, userId, params);

    // Invalidate cache
    await this.cacheManager.del(`shipping_address:id:${addressId}`);
    await this.cacheManager.del(`shipping_addresses:user:${userId}`);

    this.logger.info('usecase:shipping-address', 'Shipping address update orchestrated successfully', { address_id: addressId });
    return updated;
  }

  async delete(addressId: string, userId: string): Promise<ShippingAddress> {
    this.logger.info('usecase:shipping-address', 'Orchestrating deletion of shipping address', { address_id: addressId, user_id: userId });
    
    const address = await this.findById(addressId, userId); // Ensure it exists
    
    const deleted = await this.service.delete(addressId, userId);

    // Invalidate cache
    await this.cacheManager.del(`shipping_address:id:${addressId}`);
    await this.cacheManager.del(`shipping_addresses:user:${userId}`);

    // If we deleted the primary address, make the latest one primary if any remain
    if (address.is_primary) {
      const remaining = await this.service.findByUserId(userId);
      if (remaining.length > 0) {
        this.logger.info('usecase:shipping-address', 'Setting a new primary address after deletion of primary', { user_id: userId });
        await this.service.update(remaining[0].id, userId, { is_primary: true });
      }
    }

    this.logger.info('usecase:shipping-address', 'Shipping address deletion orchestrated successfully', { address_id: addressId });
    return deleted;
  }
}
