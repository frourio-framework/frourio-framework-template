import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import util from 'util';
import { exec } from 'child_process';
import { getPrismaClient } from '$/@frouvel/kaname/database';
import { config } from '$/@frouvel/kaname/config';
import app from '$/bootstrap/app';
import type { HttpKernel } from '$/@frouvel/kaname/foundation';

const execPromise = util.promisify(exec);

export interface TestEnvironmentOptions {
  /**
   * Whether to start a test server
   */
  startServer?: boolean;

  /**
   * Whether to run database migrations
   */
  runMigrations?: boolean;

  /**
   * Whether to refresh database before each test
   */
  refreshDatabase?: boolean;

  /**
   * Custom port for test server (defaults to API_SERVER_PORT + 11)
   */
  port?: number;

  /**
   * Custom seed function to run before each test
   */
  seed?: () => Promise<void>;
}

/**
 * Setup test environment for Vitest
 * This function should be called in vitest.config.mts setupFiles
 */
export function setupTestEnvironment(options: TestEnvironmentOptions = {}) {
  const {
    startServer = true,
    runMigrations = config('testing.database.runMigrations'),
    refreshDatabase = config('testing.database.refreshBeforeEach'),
    port = config('testing.server.port'),
    seed,
  } = options;

  let server: FastifyInstance | undefined;
  const prisma = getPrismaClient();
  let isMigrated = false;

  /**
   * Check if this is an integration test
   */
  const isIntegrationTest = (file: { filepath?: string } | undefined) => {
    return file?.filepath?.includes('integration.test');
  };

  /**
   * Check if server is needed for this test
   */
  const needsServer = (file: { filepath?: string } | undefined) => {
    return startServer && isIntegrationTest(file);
  };

  /**
   * Refresh database by truncating all tables
   */
  const refreshDatabaseTables = async () => {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      } catch (error) {
        console.error('Failed to truncate tables:', error);
      }
    }
  };

  // Register lifecycle hooks
  beforeAll(async (info) => {
    if (!needsServer({ filepath: info.file.filepath })) return;

    // Run migrations once
    if (runMigrations && !isMigrated) {
      try {
        await execPromise('npx prisma migrate deploy --schema=./database/prisma/schema.prisma');
        isMigrated = true;
      } catch (error) {
        console.error('Migration failed:', error);
        console.log('Resetting test database...');
        try {
          await execPromise('npx prisma migrate reset --force --schema=./database/prisma/schema.prisma');
          isMigrated = true;
        } catch (resetError) {
          console.error('Database reset failed:', resetError);
          throw resetError;
        }
      }
    }

    // Start test server
    const kernel = app.make<HttpKernel>('HttpKernel');
    server = await kernel.handle();
    await server.listen({ port, host: '0.0.0.0' });
  });

  beforeEach(async (info) => {
    if (!isIntegrationTest({ filepath: info?.task?.file?.name })) return;

    // Refresh database before each test
    if (refreshDatabase) {
      await refreshDatabaseTables();
    }

    // Run custom seed function
    if (seed) {
      await seed();
    }
  });

  afterEach(async (info) => {
    if (!isIntegrationTest({ filepath: info?.task?.file?.name })) return;

    await prisma.$disconnect();
  });

  afterAll(async (info) => {
    if (!needsServer({ filepath: info.file.filepath })) return;

    // Clear mocks
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Close server
    if (server) {
      await server.close();
    }

    await prisma.$disconnect();
  });

  return {
    server,
    prisma,
  };
}
