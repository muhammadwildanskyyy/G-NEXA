import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { EnvConfig } from 'src/config/env.validation';
import { Pool } from 'pg'; // 1. Import Pool dari driver pg
import { PrismaPg } from '@prisma/adapter-pg'; // 2. Import Adapter Prisma

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const connectionString = configService.get('DATABASE_URL', { infer: true });
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
      errorFormat: 'pretty',
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Success Connect To Database via Driver Adapter!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🛑 Database Disconnect');
  }
}
