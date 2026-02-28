import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { EnvConfig } from 'src/config/env.validation';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppLogger } from '../../infrastructure/logger/app.logger';

@Injectable()
export class PrismaService
  extends PrismaClient<
    Prisma.PrismaClientOptions,
    'query' | 'info' | 'warn' | 'error'
  >
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly logger: AppLogger,
  ) {
    const connectionString = configService.get('DATABASE_URL', { infer: true });
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,

      errorFormat: 'minimal',
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    this.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.dbg('repository:prisma', 'Prisma Query Executed', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });

    this.$on('info', (e: Prisma.LogEvent) => {
      this.logger.info('repository:prisma', e.message);
    });

    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warning('repository:prisma', e.message);
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.err('repository:prisma', 'Prisma Error', e.message);
    });

    await this.$connect();

    this.logger.info(
      'infra:database',
      '✅ Success Connect To Database via Driver Adapter (PostgreSQL)',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.info('infra:database', '🛑 Database Disconnected');
  }
}
