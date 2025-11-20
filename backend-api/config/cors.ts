/**
 * CORS Configuration
 *
 * Configure allowed origins for Cross-Origin Resource Sharing.
 */

import { z } from 'zod';
import { defineConfig, type ConfigType } from '$/@frouvel/kaname/config';
import { env } from '../env';

const corsConfig = defineConfig({
  schema: z.object({
    origins: z.array(z.string()),
    methods: z.array(z.string()),
    allowedHeaders: z.array(z.string()),
    exposedHeaders: z.array(z.string()),
    credentials: z.boolean(),
    maxAge: z.number().positive(),
  }),
  load: () => ({
    origins: CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400,
  }),
});

export type CorsConfig = ConfigType<typeof corsConfig>;
export const corsConfigSchema = corsConfig.schema;

// Helper to get CORS origins for backward compatibility
export const CORS_ORIGINS = [
  env.WEB_FRONTEND_URL,
  ...(env.CORS_ADDITIONAL_ORIGINS
    ? env.CORS_ADDITIONAL_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : []),
];

export default corsConfig;
