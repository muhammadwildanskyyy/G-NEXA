// src/common/pipes/zod-validation.pipe.ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod/v3';

@Injectable()
export class ZodValidatePipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      throw error;
    }
  }
}
