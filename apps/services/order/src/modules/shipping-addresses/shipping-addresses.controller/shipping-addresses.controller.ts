import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ZodValidatePipe } from '../../../common/pipe/zod-validate/zod-validate.pipe';
import {
  CreateShippingAddressSchema,
  type CreateShippingAddressDto,
  UpdateShippingAddressSchema,
  type UpdateShippingAddressDto,
  GlobalShippingAddressResponse,
} from '../dto/shipping-address.dto';
import { ShippingAddress } from '@prisma/client';
import { ShippingAddressesUsecase } from '../shipping-addresses.usecase/shipping-addresses.usecase';
import { JwtAuthGuard } from '../../../common/guards/auth/auth.guard';
import { User } from '../../../common/decorators/user/user.decorator';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Controller('/v1/api/orders/shipping-address')
@UseGuards(JwtAuthGuard)
export class ShippingAddressesController {
  constructor(
    private readonly usecase: ShippingAddressesUsecase,
    private readonly logger: AppLogger,
  ) { }

  @Post()
  async create(
    @Body(new ZodValidatePipe(CreateShippingAddressSchema)) params: CreateShippingAddressDto,
    @User('user_id') user_id: string,
  ): Promise<GlobalShippingAddressResponse<ShippingAddress>> {
    this.logger.info('controller:shipping-address', 'Received request to create shipping address', { user_id });

    const result = await this.usecase.create(user_id, params);

    return {
      meta: {
        message: 'Success Create Shipping Address',
        code: HttpStatus.CREATED,
      },
      data: result,
    };
  }

  @Get('/user')
  async getByUserId(
    @User('user_id') user_id: string,
  ): Promise<GlobalShippingAddressResponse<ShippingAddress[]>> {
    this.logger.dbg('controller:shipping-address', 'Received request to get user shipping addresses', { user_id });

    const result = await this.usecase.findByUserId(user_id);

    return {
      meta: {
        message: 'Success Get Shipping Addresses',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Get('/:id')
  async getById(
    @Param('id') id: string,
    @User('user_id') user_id: string,
  ): Promise<GlobalShippingAddressResponse<ShippingAddress>> {
    this.logger.dbg('controller:shipping-address', 'Received request to get shipping address by ID', { address_id: id });

    const result = await this.usecase.findById(id, user_id);

    return {
      meta: {
        message: 'Success Get Shipping Address',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @User('user_id') user_id: string,
    @Body(new ZodValidatePipe(UpdateShippingAddressSchema)) params: UpdateShippingAddressDto,
  ): Promise<GlobalShippingAddressResponse<ShippingAddress>> {
    this.logger.info('controller:shipping-address', 'Received request to update shipping address', { address_id: id });

    const result = await this.usecase.update(id, user_id, params);

    return {
      meta: {
        message: 'Success Update Shipping Address',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }

  @Delete('/:id')
  async delete(
    @Param('id') id: string,
    @User('user_id') user_id: string,
  ): Promise<GlobalShippingAddressResponse<ShippingAddress>> {
    this.logger.info('controller:shipping-address', 'Received request to delete shipping address', { address_id: id });

    const result = await this.usecase.delete(id, user_id);

    return {
      meta: {
        message: 'Success Delete Shipping Address',
        code: HttpStatus.OK,
      },
      data: result,
    };
  }
}
