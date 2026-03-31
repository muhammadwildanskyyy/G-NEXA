import { z } from 'zod/v3';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),

  PORT: z.coerce.number().default(8084),

  PRODUCT_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  FINANCE_SERVICE_URL: z.string().url(),

  PRODUCT_GRPC_URL: z.string().default('product-service:50051'),
  USER_GRPC_URL: z.string().default('user-service:50052'),
  FINANCE_GRPC_URL: z.string().default('finance-service:50053'),

  KAFKA_BROKER: z.string(),

  SECRET: z.string(),

  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    console.error('❌ Konfigurasi Environment Variable Tidak Valid:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}
