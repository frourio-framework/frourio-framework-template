/**
 * Database Manager Interface
 *
 * Provides a simple facade for database operations while allowing
 * direct access to underlying ORM clients for zero performance overhead.
 */

import type { DatabaseDriver } from './DatabaseDriver.interface';

export interface DatabaseManager {
  /**
   * Get the default database connection name
   */
  getDefaultConnection(): string;

  /**
   * Set the default database connection
   */
  setDefaultConnection(name: string): void;

  /**
   * Get Prisma client for direct access
   * Returns null if Prisma is not configured
   */
  prisma<T = any>(connection?: string): T | null;

  /**
   * Get Drizzle client for direct access
   * Returns null if Drizzle is not configured
   */
  drizzle<T = any>(connection?: string): T | null;

  /**
   * Get the underlying client for the specified connection
   * This is ORM-agnostic and returns whatever client is configured
   */
  client<T = any>(connection?: string): T;

  /**
   * Execute a function within a database transaction
   * The transaction type depends on the configured ORM
   */
  transaction<T>(
    callback: (client: any) => Promise<T>,
    connection?: string,
  ): Promise<T>;

  /**
   * Disconnect from database
   */
  disconnect(connection?: string): Promise<void>;

  /**
   * Disconnect from all databases
   */
  disconnectAll(): Promise<void>;

  /**
   * Check if a connection is established
   */
  isConnected(connection?: string): boolean;

  /**
   * Register a database driver (e.g., prisma, drizzle, etc.)
   */
  registerDriver(name: string, driver: DatabaseDriver): void;
}

/**
 * Database Configuration
 */
export interface DatabaseConfig {
  /**
   * Default connection name
   */
  default: string;

  /**
   * Database connections configuration
   */
  connections: Record<string, ConnectionConfig>;
}

/**
 * Connection Configuration
 */
export interface ConnectionConfig {
  /**
   * ORM driver name (e.g., 'prisma', 'drizzle')
   */
  driver: string;

  /**
   * Connection URL (for Prisma)
   */
  url?: string;

  /**
   * Connection details (for Drizzle)
   */
  connection?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  /**
   * Connection pool settings
   */
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
  };
}
