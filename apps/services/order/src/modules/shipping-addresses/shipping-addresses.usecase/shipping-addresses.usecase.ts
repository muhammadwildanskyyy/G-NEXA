import { HttpStatus, Injectable } from '@nestjs/common';
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

    this.logger.info('usecase:shipping-address', 'Shipping address creation orchestrated successfully', { address_id: createdAddress.id });
    return createdAddress;
  }

  async findByUserId(userId: string): Promise<ShippingAddress[]> {
    this.logger.dbg('usecase:shipping-address', 'Orchestrating fetch shipping addresses for user', { user_id: userId });
    return this.service.findByUserId(userId);
  }

  async findById(addressId: string, userId: string): Promise<ShippingAddress> {
    this.logger.dbg('usecase:shipping-address', 'Orchestrating fetch shipping address by ID', { address_id: addressId, user_id: userId });
    
    const address = await this.service.findById(addressId, userId);
    if (!address) {
      this.logger.warning('usecase:shipping-address', 'Shipping address not found', { address_id: addressId, user_id: userId });
      throw new AppException('Shipping Address Not Found', HttpStatus.NOT_FOUND);
    }

    return address;
  }

  async update(addressId: string, userId: string, params: UpdateShippingAddressDto): Promise<ShippingAddress> {
    this.logger.info('usecase:shipping-address', 'Orchestrating update shipping address', { address_id: addressId, user_id: userId });
    
    await this.findById(addressId, userId); // Ensure it exists

    if (params.is_primary) {
      await this.service.unsetPrimaryAddress(userId);
    }

    const updated = await this.service.update(addressId, userId, params);

    this.logger.info('usecase:shipping-address', 'Shipping address update orchestrated successfully', { address_id: addressId });
    return updated;
  }

  async delete(addressId: string, userId: string): Promise<ShippingAddress> {
    this.logger.info('usecase:shipping-address', 'Orchestrating deletion of shipping address', { address_id: addressId, user_id: userId });
    
    const address = await this.findById(addressId, userId); // Ensure it exists
    
    const deleted = await this.service.delete(addressId, userId);

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
