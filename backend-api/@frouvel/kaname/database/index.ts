/**
 * Database Module
 *
 * Provides database abstraction supporting Prisma and Drizzle ORM.
 * Use the DB facade for ORM-agnostic access with zero performance overhead.
 */

// DB Facade (recommended)
export { DB } from './DB';

// Database Manager
export { DatabaseManager } from './DatabaseManager';

// Interfaces
export type {
  DatabaseManager as IDatabaseManager,
  DatabaseConfig,
  ConnectionConfig,
} from './contracts/DatabaseManager.interface';
export type { DatabaseDriver } from './contracts/DatabaseDriver.interface';

// Prisma utilities
export {
  getPrismaClient,
  disconnectPrismaClient,
  withRetry,
  checkDatabaseConnection,
  resetPrismaConnection,
} from './PrismaClientManager';

// Drizzle utilities
export {
  getDrizzleClient,
  disconnectDrizzleClient,
  resetDrizzleConnection,
} from './DrizzleClientManager';

// Database-specific errors
export {
  DatabaseNotInitializedError,
  DatabaseConnectionNotConfiguredError,
  UnsupportedDatabaseDriverError,
  DatabaseClientUnavailableError,
  DatabaseClientCreationError,
} from './DatabaseErrors';
