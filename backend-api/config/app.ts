/**
 * Application Configuration
 * 
 * This file contains core application settings.
 */

import { z } from 'zod';
import { defineConfig, type ConfigType } from '$/@frouvel/kaname/config';
import { env } from '../env';

const appConfig = defineConfig({
  schema: z.object({
    name: z.string(),
    env: z.enum(['development', 'production', 'test']),
    debug: z.boolean(),
    url: z.string().url(),
    timezone: z.string(),
    locale: z.string(),
    fallbackLocale: z.string(),
    apiBasePath: z.string().default(''),
  }),
  load: () => ({
    name: env.APP_NAME,
    env: env.NODE_ENV,
    debug: env.APP_DEBUG,
    url: env.APP_URL,
    timezone: env.TZ,
    locale: env.APP_LOCALE,
    fallbackLocale: env.APP_FALLBACK_LOCALE,
    apiBasePath: env.API_BASE_PATH,
  }),
});

export type AppConfig = ConfigType<typeof appConfig>;
export const appConfigSchema = appConfig.schema;
export default appConfig;
