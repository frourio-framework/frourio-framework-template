/**
 * Admin Configuration
 *
 * Configuration for admin user credentials and settings.
 */

import { z } from 'zod';
import { defineConfig, type ConfigType } from '$/@frouvel/kaname/config';
import { env } from '../env';

const adminConfig = defineConfig({
  schema: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    sessionTimeout: z.number().positive(),
    tokenExpiration: z.number().positive(),
  }),
  load: () => ({
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    sessionTimeout: env.ADMIN_SESSION_TIMEOUT,
    tokenExpiration: env.ADMIN_TOKEN_EXPIRATION,
  }),
});

export type AdminConfig = ConfigType<typeof adminConfig>;
export const adminConfigSchema = adminConfig.schema;
export default adminConfig;
