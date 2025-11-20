/**
 * Database Service Provider
 *
 * Initializes the DB facade and registers database connections.
 * Automatically sets up Prisma client.
 */

import type {
  Application,
  ServiceProvider,
} from '$/@frouvel/kaname/foundation';
import { DB, getPrismaClient } from '$/@frouvel/kaname/database';

export class DatabaseServiceProvider implements ServiceProvider {
  async register(app: Application): Promise<void> {
    // Get database config from container
    // Config is loaded by LoadConfiguration bootstrapper
    let dbConfig;
    try {
      const config = app.make<Record<string, any>>('config');
      dbConfig = config.database;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Config not loaded yet, use default config
      dbConfig = {
        default: 'default',
        connections: {
          default: {
            driver: 'prisma',
          },
        },
      };
    }

    // Initialize DB facade with config
    DB.init(dbConfig);

    // Register Prisma client
    const prisma = getPrismaClient();
    DB.register('default', prisma, 'prisma');

    // Register in container
    app.singleton('prisma', () => prisma);
    app.singleton('db', () => DB);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async boot(app: Application): Promise<void> {
    // Database is ready
    if (DB.isConnected()) {
      console.log('[Database] Connection established');
    }
  }
}
