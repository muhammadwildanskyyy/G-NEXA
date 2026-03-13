import { z } from 'zod/v3';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),

  PORT: z.coerce.number().default(8084),

  PRODUCT_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  FINANCE_SERVICE_URL: z.string().url(),

  KAFKA_BROKER: z.string(),

  SECRET: z.string(),
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
