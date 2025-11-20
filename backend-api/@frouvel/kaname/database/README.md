# Database Module

Database abstraction layer supporting both Prisma and Drizzle ORM with **zero performance overhead** through direct pass-through access.

## Philosophy

Unlike traditional ORMs that add abstraction layers, our approach:

1. **Direct Pass-Through**: Zero overhead access to Prisma/Drizzle clients
2. **No Query Builder**: Use each ORM's native API (they're already excellent!)
3. **Simple Facade**: Just connection management and transactions
4. **Type-Safe**: Full TypeScript support maintained

## Quick Start

### Using Prisma (Default)

```typescript
import { DB } from '$/@frouvel/kaname/database';

// Direct Prisma access - zero overhead!
const prisma = DB.prisma();

// Use Prisma's full API
const users = await prisma.user.findMany({
  where: { age: { gte: 18 } },
  include: { posts: true },
  orderBy: { createdAt: 'desc' },
});

// Transactions
await DB.transaction(async (tx) => {
  const user = await tx.user.create({
    data: { name: 'John Doe', email: 'john@example.com' },
  });
  
  await tx.profile.create({
    data: { userId: user.id, bio: 'Hello!' },
  });
});
```

### Using Drizzle

```typescript
import { DB } from '$/@frouvel/kaname/database';
import { users, posts } from '$/schema';
import { eq } from 'drizzle-orm';

// Direct Drizzle access - zero overhead!
const db = DB.drizzle();

// Use Drizzle's full API
const result = await db
  .select()
  .from(users)
  .where(eq(users.age, 18))
  .leftJoin(posts, eq(users.id, posts.userId));

// Transactions
await DB.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({
    name: 'John Doe',
    email: 'john@example.com'
  }).returning();
  
  await tx.insert(profiles).values({
    userId: user.id,
    bio: 'Hello!',
  });
});
```

## Configuration

### config/database.ts

```typescript
import type { DatabaseConfig } from '$/@frouvel/kaname/database';
import { env } from '$/env';

export default {
  // Default connection
  default: 'primary',

  // Connection configurations
  connections: {
    // Prisma connection
    primary: {
      driver: 'prisma',
      url: env('DATABASE_URL'),
      pool: {
        min: env('DB_POOL_MIN', 2),
        max: env('DB_POOL_MAX', 10),
      },
    },

    // Drizzle connection (optional)
    analytics: {
      driver: 'drizzle',
      connection: {
        host: env('ANALYTICS_DB_HOST', 'localhost'),
        port: env('ANALYTICS_DB_PORT', 5432),
        user: env('ANALYTICS_DB_USER'),
        password: env('ANALYTICS_DB_PASSWORD'),
        database: env('ANALYTICS_DB_DATABASE'),
      },
    },

    // Read replica (optional)
    'read-replica': {
      driver: 'prisma',
      url: env('READ_REPLICA_URL'),
    },
  },
} satisfies DatabaseConfig;
```

### Adding a custom driver

You can plug in another ORM/driver by implementing `DatabaseDriver` and registering it before use:

```typescript
import { DB, type DatabaseDriver } from '$/@frouvel/kaname/database';

const myDriver: DatabaseDriver = {
  createClient: (config) => /* return client from config */ {},
  transaction: (client, cb) => client.transaction(cb),
  disconnect: (client) => client.disconnect?.(),
};

DB.getManager().registerDriver('my-driver', myDriver);
```

## API Reference

### DB.prisma()

Get direct access to Prisma client (zero overhead).

```typescript
const prisma = DB.prisma(); // Default connection
const replica = DB.prisma('read-replica'); // Specific connection

// Use Prisma's full API
const users = await prisma.user.findMany({
  where: { status: 'active' },
  include: { posts: { take: 5 } },
});
```

### DB.drizzle()

Get direct access to Drizzle client (zero overhead).

```typescript
const db = DB.drizzle(); // Default connection
const analytics = DB.drizzle('analytics'); // Specific connection

// Use Drizzle's full API
const users = await db.select().from(usersTable);
```

### DB.transaction()

Execute operations within a transaction.

```typescript
// Prisma transaction
await DB.transaction(async (prisma) => {
  await prisma.user.create({ data: { name: 'John' } });
  await prisma.profile.create({ data: { userId: 1 } });
});

// Drizzle transaction
await DB.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'John' });
  await tx.insert(profiles).values({ userId: 1 });
});

// Specific connection
await DB.transaction(async (tx) => {
  // ... operations
}, 'read-replica');
```

### DB.client()

Get the underlying client (ORM-agnostic).

```typescript
const client = DB.client(); // Returns Prisma or Drizzle based on config
```

### Multiple Connections

```typescript
// Switch default connection
DB.setDefaultConnection('read-replica');
const users = DB.prisma().user.findMany(); // Uses read replica

// Or specify connection directly
const primary = DB.prisma('primary');
const replica = DB.prisma('read-replica');
const analytics = DB.drizzle('analytics');
```

## Usage Patterns

### Pattern 1: Direct Usage (Simplest)

```typescript
import { DB } from '$/@frouvel/kaname/database';

export class UserService {
  async getActiveUsers() {
    const prisma = DB.prisma();
    return prisma.user.findMany({
      where: { status: 'active' },
    });
  }
}
```

### Pattern 2: Repository Pattern (Recommended)

```typescript
import { DB } from '$/@frouvel/kaname/database';

export class UserRepository {
  private prisma = DB.prisma();

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { posts: true },
    });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }

  async paginate(page: number, limit: number) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.user.count(),
    ]);

    return { users, total };
  }
}
```

### Pattern 3: Multiple ORMs

```typescript
import { DB } from '$/@frouvel/kaname/database';
import { analyticsEvents } from '$/schema';

export class AnalyticsService {
  private prisma = DB.prisma('primary');
  private analytics = DB.drizzle('analytics');

  async trackUserAction(userId: string, action: string) {
    // Store in Drizzle analytics DB
    await this.analytics.insert(analyticsEvents).values({
      userId,
      action,
      timestamp: new Date(),
    });

    // Update user stats in Prisma
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });
  }
}
```

## Testing Support

The `TestCaseDatabase` works seamlessly with the DB facade:

```typescript
import { TestCaseDatabase, DB } from '$/@frouvel/kaname/testing';
import { expect } from 'vitest';

class UserRepositoryTest extends TestCaseDatabase {
  private repository: UserRepository;

  protected async setUp() {
    await super.setUp();
    this.repository = new UserRepository();
  }

  run() {
    this.suite('UserRepository', () => {
      this.test('can create user', async () => {
        const user = await this.repository.create({
          name: 'John Doe',
          email: 'john@example.com',
        });

        expect(user).toBeDefined();
        expect(user.name).toBe('John Doe');

        // Can also use DB facade directly in tests
        const found = await DB.prisma().user.findUnique({
          where: { id: user.id },
        });
        expect(found).toBeDefined();
      });
    });
  }
}

new UserRepositoryTest().run();
```

## Migration from Direct Prisma

### Before

```typescript
import { getPrismaClient } from '$/@frouvel/kaname/database';

const prisma = getPrismaClient();
const users = await prisma.user.findMany();
```

### After

```typescript
import { DB } from '$/@frouvel/kaname/database';

const prisma = DB.prisma();
const users = await prisma.user.findMany();
```

**Note**: `getPrismaClient()` still works for backward compatibility but is deprecated.

## Performance

**Zero overhead!** The DB facade provides direct pass-through to the underlying ORM client:

```typescript
// These are equivalent in performance:
const prisma = getPrismaClient();
const users1 = await prisma.user.findMany();

const users2 = await DB.prisma().user.findMany();
// Same speed - DB.prisma() just returns the client directly!
```

## Why Not a Query Builder?

Query builders add abstraction and learning curves. Instead:

1. **Prisma** already has excellent TypeScript support and query API
2. **Drizzle** is designed to be close to SQL with great DX
3. **Zero Overhead**: Direct access means no performance penalty
4. **Full Features**: Access to all ORM-specific features
5. **Type Safety**: Maintain full TypeScript types from your ORM

## Advanced Usage

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  await DB.disconnectAll();
  process.exit(0);
});
```

### Health Checks

```typescript
export async function checkDatabaseHealth() {
  try {
    const prisma = DB.prisma();
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error };
  }
}
```

### Custom Connection Registration

```typescript
import { PrismaClient } from '@prisma/client';
import { DB } from '$/@frouvel/kaname/database';

// Create custom Prisma client with extensions
const prisma = new PrismaClient().$extends({
  // Your extensions here
});

// Register it
DB.register('custom', prisma, 'prisma');

// Use it
const users = await DB.prisma('custom').user.findMany();
```

## Best Practices

1. **Use DB Facade**: Import `DB` instead of `getPrismaClient()`
2. **Repository Pattern**: Encapsulate data access in repository classes
3. **Connection Names**: Use descriptive names (`primary`, `read-replica`, `analytics`)
4. **Transactions**: Always use `DB.transaction()` for multiple operations
5. **Testing**: Use `TestCaseDatabase` for integration tests
6. **Read Replicas**: Route read-heavy operations to read replicas

## Troubleshooting

### "Database manager not initialized"

Make sure `DatabaseServiceProvider` is registered in your `bootstrap/app.ts`:

```typescript
import { DatabaseServiceProvider } from '$/@frouvel/kaname/foundation';

const providers = [
  DatabaseServiceProvider,
  // ... other providers
];
```

### Type Errors with Prisma Client

Make sure you've generated Prisma client:

```bash
npm run generate:prisma
```

### Multiple Connections Not Working

Check your `config/database.ts` has all connections defined and the connection name matches.

## See Also

- [Architecture Document](./ARCHITECTURE.md) - Detailed architectural design
- [Prisma Documentation](https://www.prisma.io/docs)
- [Drizzle Documentation](https://orm.drizzle.team/docs/overview)
