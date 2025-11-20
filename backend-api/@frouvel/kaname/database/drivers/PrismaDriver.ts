import type { DatabaseDriver } from '../contracts/DatabaseDriver.interface';
import type { ConnectionConfig } from '../contracts/DatabaseManager.interface';
import { getPrismaClient } from '../PrismaClientManager';

/**
 * Prisma database driver
 */
export class PrismaDriver implements DatabaseDriver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createClient(_config: ConnectionConfig): any {
    // Prisma client creation is centralized in PrismaClientManager to reuse connections.
    return getPrismaClient();
  }

  async transaction<T>(
    client: any,
    callback: (client: any) => Promise<T>,
  ): Promise<T> {
    return client.$transaction(callback);
  }

  async disconnect(client: any): Promise<void> {
    if (client?.$disconnect) {
      await client.$disconnect();
    }
  }
}
