import { Module } from '@nestjs/common';
import { ShippingAddressesController } from './shipping-addresses.controller/shipping-addresses.controller';
import { ShippingAddressesService } from './shipping-addresses.service/shipping-addresses.service';
import { ShippingAddressesRepository } from './shipping-addresses.repository/shipping-addresses.repository';
import { ShippingAddressesUsecase } from './shipping-addresses.usecase/shipping-addresses.usecase';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AppLogger } from '../../infrastructure/logger/app.logger';

@Module({
  imports: [PrismaModule],
  controllers: [ShippingAddressesController],
  providers: [ShippingAddressesUsecase, ShippingAddressesService, ShippingAddressesRepository, AppLogger],
  exports: [ShippingAddressesUsecase, ShippingAddressesService],
})
export class ShippingAddressesModule {}
