import { TestCase } from './TestCase';
import { getPrismaClient } from '$/@frouvel/kaname/database';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * TestCaseDatabase provides database-specific testing utilities
 * Automatically handles database migrations and cleanup
 */
export abstract class TestCaseDatabase extends TestCase {
  protected prisma: ReturnType<typeof getPrismaClient>;
  private static isMigrated = false;

  constructor() {
    super();
    this.prisma = getPrismaClient();
  }

  /**
   * Run database migrations before tests
   */
  protected async setUpBeforeClass(): Promise<void> {
    await super.setUpBeforeClass();

    if (!TestCaseDatabase.isMigrated) {
      try {
        await execPromise('npx prisma migrate deploy --schema=./database/prisma/schema.prisma');
        TestCaseDatabase.isMigrated = true;
      } catch (error) {
        console.error('Migration failed:', error);
        console.log('Resetting test database...');
        try {
          await execPromise('npx prisma migrate reset --force --schema=./database/prisma/schema.prisma');
          TestCaseDatabase.isMigrated = true;
        } catch (resetError) {
          console.error('Database reset failed:', resetError);
          throw resetError;
        }
      }
    }
  }

  /**
   * Refresh database (truncate all tables) before each test
   */
  protected async setUp(): Promise<void> {
    await super.setUp();
    await this.refreshDatabase();
  }

  /**
   * Disconnect from database after each test
   */
  protected async tearDown(): Promise<void> {
    await this.prisma.$disconnect();
    await super.tearDown();
  }

  /**
   * Disconnect from database after all tests
   */
  protected async tearDownAfterClass(): Promise<void> {
    await this.prisma.$disconnect();
    await super.tearDownAfterClass();
  }

  /**
   * Truncate all tables in the database
   */
  protected async refreshDatabase(): Promise<void> {
    const tablenames = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables) {
      try {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      } catch (error) {
        console.error('Failed to truncate tables:', error);
        throw error;
      }
    }
  }

  /**
   * Seed the database with test data
   * Override this method in test classes to provide custom seeding
   */
  protected async seed(): Promise<void> {
    // Override in subclass
  }

  /**
   * Run database operations in a transaction
   */
  protected async transaction<T>(
    fn: (tx: ReturnType<typeof getPrismaClient>) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx as ReturnType<typeof getPrismaClient>);
    });
  }
}
