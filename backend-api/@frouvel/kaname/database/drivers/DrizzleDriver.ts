import type { DatabaseDriver } from '../contracts/DatabaseDriver.interface';
import type { ConnectionConfig } from '../contracts/DatabaseManager.interface';
import { getDrizzleClient } from '../DrizzleClientManager';

/**
 * Drizzle ORM database driver
 */
export class DrizzleDriver implements DatabaseDriver {
  createClient(config: ConnectionConfig): any {
    const url = config.url ?? this.buildUrlFromConnection(config);
    if (!url) {
      throw new Error('Drizzle connection URL is required in config');
    }
    return getDrizzleClient(url);
  }

  async transaction<T>(
    client: any,
    callback: (client: any) => Promise<T>,
  ): Promise<T> {
    return client.transaction(callback);
  }

  async disconnect(client: any): Promise<void> {
    if (client?.end) {
      await client.end();
    }
  }

  private buildUrlFromConnection(config: ConnectionConfig): string | undefined {
    const conn = config.connection;
    if (!conn) return undefined;

    const auth = conn.password ? `${conn.user}:${conn.password}` : conn.user;
    return `postgresql://${auth}@${conn.host}:${conn.port}/${conn.database}`;
  }
}
