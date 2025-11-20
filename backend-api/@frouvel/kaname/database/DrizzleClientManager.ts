import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '$/database/drizzle/schema';

let drizzleClient: PostgresJsDatabase<typeof schema> | null = null;
let postgresConnection: ReturnType<typeof postgres> | null = null;

/**
 * Get Drizzle client instance
 *
 * @example
 * ```typescript
 * const db = getDrizzleClient();
 * const users = await db.select().from(schema.users);
 * ```
 */
export function getDrizzleClient(
  connectionString?: string,
): PostgresJsDatabase<typeof schema> {
  if (drizzleClient) {
    return drizzleClient;
  }

  const dbUrl = connectionString || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Create postgres connection
  postgresConnection = postgres(dbUrl);

  // Create Drizzle client with schema
  drizzleClient = drizzle(postgresConnection, { schema });

  return drizzleClient;
}

/**
 * Disconnect Drizzle client
 */
export async function disconnectDrizzleClient(): Promise<void> {
  if (postgresConnection) {
    await postgresConnection.end();
    postgresConnection = null;
    drizzleClient = null;
  }
}

/**
 * Reset Drizzle connection (useful for testing)
 */
export function resetDrizzleConnection(): void {
  drizzleClient = null;
  postgresConnection = null;
}
