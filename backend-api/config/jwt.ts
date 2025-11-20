/**
 * JWT Configuration
 * 
 * Configuration for JSON Web Token authentication.
 */

import { z } from 'zod';
import { defineConfig, type ConfigType } from '$/@frouvel/kaname/config';
import { env } from '../env';

const jwtConfig = defineConfig({
  schema: z.object({
    secret: z.string().min(1),
    expiresIn: z.number().positive(),
    refreshExpiresIn: z.number().positive(),
    scope: z.object({
      admin: z.tuple([z.literal('admin')]),
      user: z.object({
        default: z.tuple([z.literal('user')]),
      }),
    }),
    algorithm: z.literal('HS256'),
    issuer: z.string(),
    audience: z.string(),
  }),
  load: () => ({
    secret: env.API_JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    scope: {
      admin: ['admin'] as ['admin'],
      user: {
        default: ['user'] as ['user'],
      },
    },
    algorithm: 'HS256' as const,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  }),
});

export type JwtConfig = ConfigType<typeof jwtConfig>;
export const jwtConfigSchema = jwtConfig.schema;
export default jwtConfig;
