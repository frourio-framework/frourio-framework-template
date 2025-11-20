/**
 * Foundation Helpers
 *
 * Helper functions for accessing framework services in application code.
 */

import type { FastifyInstance } from 'fastify';
import type { Application } from './Application';
import type { PrismaClient } from '@prisma/client';

/**
 * Get the Application instance from Fastify
 *
 * The Application instance is attached to Fastify by HttpKernel during bootstrap.
 * This helper provides type-safe access to the container.
 *
 * @param fastify - The Fastify instance
 * @returns The Application container instance
 * @throws Error if Application is not attached to Fastify
 *
 * @example
 * ```ts
 * import { getApp } from '$/@frouvel/kaname/foundation/helpers';
 *
 * export default defineController((fastify) => ({
 *   get: () => {
 *     const app = getApp(fastify);
 *     const prisma = app.make<PrismaClient>('prisma');
 *     // Use prisma...
 *   }
 * }));
 * ```
 */
export function getApp(fastify: FastifyInstance): Application {
  const app = (fastify as any).app;

  if (!app) {
    throw new Error(
      'Application instance not found on Fastify. ' +
        'Make sure HttpKernel has attached the Application instance.',
    );
  }

  return app as Application;
}

/**
 * Get Prisma client from the container
 *
 * Convenience helper to get the database client directly.
 *
 * @param fastify - The Fastify instance
 * @returns PrismaClient instance from the container
 *
 * @example
 * ```ts
 * import { getPrisma } from '$/@frouvel/kaname/foundation/helpers';
 *
 * export default defineController((fastify) => ({
 *   get: () => {
 *     const prisma = getPrisma(fastify);
 *     // Use prisma...
 *   }
 * }));
 * ```
 */
export function getPrisma(fastify: FastifyInstance): PrismaClient {
  const app = getApp(fastify);
  return app.make<PrismaClient>('prisma');
}