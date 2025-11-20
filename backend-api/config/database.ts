import { z } from 'zod';
import { defineConfig, type ConfigType } from '$/@frouvel/kaname/config';
import { env } from '../env';

const databaseConfig = defineConfig({
  schema: z.object({
    default: z.string(),
    connections: z.record(
      z.object({
        driver: z.string(),
        url: z.string().optional(),
        connection: z
          .object({
            host: z.string(),
            port: z.number(),
            user: z.string(),
            password: z.string(),
            database: z.string(),
          })
          .optional(),
        pool: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
            idleTimeoutMillis: z.number().optional(),
          })
          .optional(),
      }),
    ),
  }),
  load: () => ({
    default: 'default',
    connections: {
      default: {
        driver: 'prisma',
        url: env.DATABASE_URL,
        pool: {
          min: env.DB_POOL_MIN,
          max: env.DB_POOL_MAX,
        },
      },
      // Add additional connections here (e.g., read replicas or Drizzle)
    },
  }),
});

export type DatabaseConfig = ConfigType<typeof databaseConfig>;
export const databaseConfigSchema = databaseConfig.schema;
export default databaseConfig;
