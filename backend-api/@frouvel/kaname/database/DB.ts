import type { PrismaClient } from '@prisma/client';
import { DatabaseManager } from './DatabaseManager';
import type {
  DatabaseConfig,
  DatabaseManager as IDatabaseManager,
} from './contracts/DatabaseManager.interface';
import { DatabaseNotInitializedError } from './DatabaseErrors';

/**
 * DB Facade
 *
 * Global singleton for database access with zero performance overhead.
 * Provides direct pass-through to Prisma/Drizzle clients.
 *
 * @example
 * ```typescript
 * import { DB } from '$/@frouvel/kaname/database';
 *
 * // Direct Prisma access (zero overhead)
 * const prisma = DB.prisma();
 * const users = await prisma.user.findMany({
 *   where: { age: { gt: 18 } },
 *   include: { posts: true }
 * });
 *
 * // Transactions
 * await DB.transaction(async (prisma) => {
 *   await prisma.user.create({ data: { name: 'John' } });
 *   await prisma.profile.create({ data: { userId: 1 } });
 * });
 *
 * // Multiple connections
 * const readReplica = DB.prisma('read-replica');
 * const analytics = DB.drizzle('analytics');
 * ```
 */
class DBFacade {
  private manager: DatabaseManager | null = null;
  private config: DatabaseConfig | null = null;

  /**
   * Initialize the database manager with configuration
   */
  init(config: DatabaseConfig): void {
    this.config = config;
    this.manager = new DatabaseManager(config);
  }

  /**
   * Get the underlying database manager instance
   * Useful for advanced usage
   */
  getManager(): IDatabaseManager {
    if (!this.manager) {
      throw new DatabaseNotInitializedError();
    }
    return this.manager;
  }

  /**
   * Register a pre-configured database client
   *
   * @example
   * ```typescript
   * import { PrismaClient } from '@prisma/client';
   *
   * const prisma = new PrismaClient();
   * DB.register('default', prisma, 'prisma');
   * ```
   */
  register(name: string, client: any, driver: string): void {
    if (!this.manager) {
      // Auto-initialize if not already initialized
      this.init({
        default: name,
        connections: {},
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.manager!.registerClient(name, client, driver);
  }

  /**
   * Get Prisma client for direct access (zero overhead)
   *
   * @example
   * ```typescript
   * const prisma = DB.prisma();
   * const users = await prisma.user.findMany();
   *
   * // Use Prisma's full API
   * const result = await prisma.user.findMany({
   *   where: { age: { gte: 18 } },
   *   include: { posts: { take: 5 } },
   *   orderBy: { createdAt: 'desc' }
   * });
   * ```
   */
  prisma<T = PrismaClient>(connection?: string): T {
    const client = this.getManager().prisma<T>(connection);
    if (!client) {
      const name = connection || this.getManager().getDefaultConnection();
      throw new Error(
        `Prisma client not available for connection '${name}'. Make sure the connection is configured with driver: 'prisma'.`,
      );
    }
    return client;
  }

  /**
   * Get Drizzle client for direct access (zero overhead)
   *
   * @example
   * ```typescript
   * const db = DB.drizzle();
   * const users = await db.select().from(usersTable);
   *
   * // Use Drizzle's full API
   * const result = await db
   *   .select()
   *   .from(users)
   *   .where(eq(users.age, 18))
   *   .leftJoin(posts, eq(users.id, posts.userId));
   * ```
   */
  drizzle<T = any>(connection?: string): T {
    const client = this.getManager().drizzle<T>(connection);
    if (!client) {
      const name = connection || this.getManager().getDefaultConnection();
      throw new Error(
        `Drizzle client not available for connection '${name}'. Make sure the connection is configured with driver: 'drizzle'.`,
      );
    }
    return client;
  }

  /**
   * Get the underlying database client (ORM-agnostic)
   *
   * @example
   * ```typescript
   * const client = DB.client();
   * // client is either Prisma or Drizzle depending on configuration
   * ```
   */
  client<T = any>(connection?: string): T {
    return this.getManager().client<T>(connection);
  }

  /**
   * Execute a function within a database transaction
   *
   * @example
   * ```typescript
   * // Prisma transaction
   * await DB.transaction(async (prisma) => {
   *   const user = await prisma.user.create({ data: { name: 'John' } });
   *   await prisma.profile.create({ data: { userId: user.id } });
   * });
   *
   * // Drizzle transaction
   * await DB.transaction(async (tx) => {
   *   await tx.insert(users).values({ name: 'John' });
   *   await tx.insert(profiles).values({ userId: 1 });
   * });
   * ```
   */
  async transaction<T>(
    callback: (client: any) => Promise<T>,
    connection?: string,
  ): Promise<T> {
    return this.getManager().transaction(callback, connection);
  }

  /**
   * Disconnect from a specific database connection
   */
  async disconnect(connection?: string): Promise<void> {
    return this.getManager().disconnect(connection);
  }

  /**
   * Disconnect from all database connections
   *
   * @example
   * ```typescript
   * // In your app shutdown handler
   * process.on('SIGTERM', async () => {
   *   await DB.disconnectAll();
   *   process.exit(0);
   * });
   * ```
   */
  async disconnectAll(): Promise<void> {
    return this.getManager().disconnectAll();
  }

  /**
   * Check if a connection is established
   */
  isConnected(connection?: string): boolean {
    return this.getManager().isConnected(connection);
  }

  /**
   * Get the default connection name
   */
  getDefaultConnection(): string {
    return this.getManager().getDefaultConnection();
  }

  /**
   * Set the default connection
   *
   * @example
   * ```typescript
   * // Switch to read replica for read-heavy operations
   * DB.setDefaultConnection('read-replica');
   * const users = DB.prisma().user.findMany();
   *
   * // Switch back to primary
   * DB.setDefaultConnection('primary');
   * ```
   */
  setDefaultConnection(name: string): void {
    return this.getManager().setDefaultConnection(name);
  }

  /**
   * Reset the database manager (useful for testing)
   */
  reset(): void {
    this.manager = null;
    this.config = null;
  }
}

/**
 * Global DB Facade instance
 *
 * Import this in your code to access database functionality.
 *
 * @example
 * ```typescript
 * import { DB } from '$/@frouvel/kaname/database';
 *
 * const users = await DB.prisma().user.findMany();
 * ```
 */
export const DB = new DBFacade();
