import type { ConnectionConfig } from './DatabaseManager.interface';

/**
 * DatabaseDriver defines how a specific ORM/driver integrates with the
 * DatabaseManager. Each driver is responsible for creating its client,
 * handling transactions, and cleaning up connections.
 */
export interface DatabaseDriver {
  /**
   * Create a client instance for the given connection configuration.
   */
  createClient(config: ConnectionConfig, name: string): any;

  /**
   * Execute a callback within a transaction using the provided client.
   */
  transaction<T>(
    client: any,
    callback: (client: any) => Promise<T>,
  ): Promise<T>;

  /**
   * Disconnect / clean up the client.
   */
  disconnect(client: any): Promise<void>;
}
