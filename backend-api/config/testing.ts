/**
 * Testing Configuration
 *
 * Centralizes testing-related settings so framework code does not read env directly.
 */

import { z } from 'zod';
import { defineConfig, type ConfigType } from '$/@frouvel/kaname/config';
import { env } from '../env';

const testingConfig = defineConfig({
  schema: z.object({
    server: z.object({
      host: z.string().default('0.0.0.0'),
      port: z.number(),
    }),
    database: z.object({
      runMigrations: z.boolean().default(true),
      refreshBeforeEach: z.boolean().default(true),
    }),
  }),
  load: () => ({
    server: {
      host: '0.0.0.0',
      port: env.API_SERVER_PORT + 11,
    },
    database: {
      runMigrations: true,
      refreshBeforeEach: true,
    },
  }),
});

export type TestingConfig = ConfigType<typeof testingConfig>;
export const testingConfigSchema = testingConfig.schema;
export default testingConfig;
