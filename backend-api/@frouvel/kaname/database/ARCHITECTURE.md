# Database Abstraction Architecture

## Overview

This document outlines the architecture for database abstraction in frourio-framework, supporting multiple ORMs (Prisma, Drizzle) similar to Laravel's Eloquent ORM and DB facade patterns.

## Goals

1. **ORM Agnostic**: Support both Prisma and Drizzle ORM seamlessly
2. **Consistent API**: Provide unified interface regardless of underlying ORM
3. **Type Safety**: Maintain TypeScript type safety across ORMs
4. **Testing**: Easy mocking and testing regardless of ORM choice
5. **Migration**: Simple switching between ORMs with minimal code changes

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Application Layer                 │
│  (UseCases, Services, Repositories)         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Database Manager (Facade)           │
│  - DB.connection()                          │
│  - DB.transaction()                         │
│  - DB.table()                               │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────┐    ┌──────────────┐
│   Prisma     │    │   Drizzle    │
│   Adapter    │    │   Adapter    │
└──────────────┘    └──────────────┘
```

## Core Components

### 1. Database Connection Interface

```typescript
interface DatabaseConnection {
  // Execute raw queries
  raw<T>(query: string, params?: any[]): Promise<T>;
  
  // Transaction support
  transaction<T>(callback: (tx: DatabaseConnection) => Promise<T>): Promise<T>;
  
  // Get underlying client
  client(): any;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
```

### 2. Query Builder Interface

```typescript
interface QueryBuilder<T> {
  select(...columns: string[]): this;
  where(column: string, operator: string, value: any): this;
  whereIn(column: string, values: any[]): this;
  orderBy(column: string, direction?: 'asc' | 'desc'): this;
  limit(count: number): this;
  offset(count: number): this;
  
  // Execution methods
  first(): Promise<T | null>;
  get(): Promise<T[]>;
  count(): Promise<number>;
  insert(data: Partial<T>): Promise<T>;
  update(data: Partial<T>): Promise<T>;
  delete(): Promise<void>;
}
```

### 3. Database Manager (Facade)

```typescript
class DatabaseManager {
  private adapters: Map<string, DatabaseAdapter> = new Map();
  private defaultConnection: string = 'default';
  
  // Register ORM adapter
  extend(name: string, adapter: DatabaseAdapter): void;
  
  // Get connection
  connection(name?: string): DatabaseConnection;
  
  // Query builder
  table<T>(tableName: string): QueryBuilder<T>;
  
  // Transaction wrapper
  transaction<T>(callback: (db: DatabaseManager) => Promise<T>): Promise<T>;
  
  // Raw queries
  raw<T>(query: string, params?: any[]): Promise<T>;
}
```

### 4. ORM Adapters

#### Prisma Adapter

```typescript
class PrismaAdapter implements DatabaseAdapter {
  constructor(private client: PrismaClient) {}
  
  getConnection(): DatabaseConnection {
    return new PrismaConnection(this.client);
  }
  
  createQueryBuilder<T>(table: string): QueryBuilder<T> {
    return new PrismaQueryBuilder<T>(this.client, table);
  }
}
```

#### Drizzle Adapter

```typescript
class DrizzleAdapter implements DatabaseAdapter {
  constructor(private client: DrizzleClient) {}
  
  getConnection(): DatabaseConnection {
    return new DrizzleConnection(this.client);
  }
  
  createQueryBuilder<T>(table: string): QueryBuilder<T> {
    return new DrizzleQueryBuilder<T>(this.client, table);
  }
}
```

## Usage Patterns

### Pattern 1: Using DB Facade

```typescript
import { DB } from '$/@frouvel/kaname/database';

// Raw queries
const users = await DB.raw<User[]>(
  'SELECT * FROM users WHERE age > ?',
  [18]
);

// Query builder
const activeUsers = await DB.table<User>('users')
  .where('status', '=', 'active')
  .where('age', '>', 18)
  .orderBy('created_at', 'desc')
  .get();

// Transactions
await DB.transaction(async (db) => {
  const user = await db.table('users').insert({ name: 'John' });
  await db.table('profiles').insert({ user_id: user.id });
});
```

### Pattern 2: Repository Pattern

```typescript
export class UserRepository {
  private db = DB.connection();
  
  async findById(id: string): Promise<User | null> {
    return DB.table<User>('users')
      .where('id', '=', id)
      .first();
  }
  
  async createUser(data: CreateUserDto): Promise<User> {
    return DB.table<User>('users').insert(data);
  }
  
  async paginate(page: number, limit: number) {
    const users = await DB.table<User>('users')
      .limit(limit)
      .offset((page - 1) * limit)
      .get();
      
    const total = await DB.table<User>('users').count();
    
    return { users, total };
  }
}
```

### Pattern 3: Direct Client Access (when needed)

```typescript
import { DB } from '$/@frouvel/kaname/database';

// Get Prisma client
const prisma = DB.connection().client() as PrismaClient;
await prisma.user.findMany({
  include: { posts: true }
});

// Get Drizzle client
const drizzle = DB.connection('drizzle').client() as DrizzleClient;
await drizzle.select().from(users);
```

## Configuration

### config/database.ts

```typescript
export default {
  default: 'prisma', // or 'drizzle'
  
  connections: {
    prisma: {
      driver: 'prisma',
      url: env('DATABASE_URL'),
      pool: {
        min: env('DB_POOL_MIN', 2),
        max: env('DB_POOL_MAX', 10),
      },
    },
    
    drizzle: {
      driver: 'drizzle',
      client: 'postgres',
      connection: {
        host: env('DB_HOST', 'localhost'),
        port: env('DB_PORT', 5432),
        user: env('DB_USER'),
        password: env('DB_PASSWORD'),
        database: env('DB_DATABASE'),
      },
    },
  },
};
```

## Testing Support

### Updated TestCaseDatabase

```typescript
export abstract class TestCaseDatabase extends TestCase {
  protected db = DB.connection();
  
  protected async refreshDatabase(): Promise<void> {
    // ORM-agnostic database refresh
    await this.db.raw('TRUNCATE TABLE users, posts CASCADE');
  }
  
  protected async seed(): Promise<void> {
    // Override in test classes
  }
  
  protected async transaction<T>(fn: (db: DatabaseManager) => Promise<T>) {
    return DB.transaction(fn);
  }
}
```

### Test Example

```typescript
class UserRepositoryTest extends TestCaseDatabase {
  private repository: UserRepository;
  
  protected async setUp(): Promise<void> {
    await super.setUp();
    this.repository = new UserRepository();
  }
  
  run() {
    this.suite('UserRepository', () => {
      this.test('can create user', async () => {
        const user = await this.repository.createUser({
          name: 'John Doe',
          email: 'john@example.com',
        });
        
        expect(user.id).toBeDefined();
        expect(user.name).toBe('John Doe');
      });
    });
  }
}
```

## Migration Path

### Phase 1: Core Abstraction
- [ ] Create DatabaseConnection interface
- [ ] Create QueryBuilder interface
- [ ] Create DatabaseAdapter interface
- [ ] Implement DatabaseManager (DB facade)

### Phase 2: Prisma Adapter
- [ ] Implement PrismaConnection
- [ ] Implement PrismaQueryBuilder
- [ ] Implement PrismaAdapter
- [ ] Register in DatabaseManager

### Phase 3: Drizzle Adapter
- [ ] Implement DrizzleConnection
- [ ] Implement DrizzleQueryBuilder
- [ ] Implement DrizzleAdapter
- [ ] Register in DatabaseManager

### Phase 4: Testing Support
- [ ] Update TestCaseDatabase
- [ ] Update test helpers
- [ ] Create migration utilities
- [ ] Add test examples

### Phase 5: Documentation
- [ ] API documentation
- [ ] Migration guide
- [ ] Best practices
- [ ] Example repositories

## Benefits

1. **Flexibility**: Switch ORMs without changing application code
2. **Consistency**: Unified API across different ORMs
3. **Testing**: Easy to mock and test
4. **Type Safety**: Full TypeScript support
5. **Gradual Migration**: Migrate from one ORM to another incrementally

## Trade-offs

### Pros
- ORM-agnostic application code
- Easier testing and mocking
- Consistent API across projects
- Simpler ORM migration

### Cons
- Additional abstraction layer
- Potential performance overhead
- May not expose all ORM-specific features
- Learning curve for new pattern

## Recommendations

1. **Start with Prisma**: Use Prisma adapter as the default
2. **Facade Pattern**: Use DB facade for common operations
3. **Direct Access**: Use direct client access for complex queries
4. **Repository Pattern**: Encapsulate database logic in repositories
5. **Testing**: Use the abstraction layer in tests for flexibility

## Future Enhancements

1. **Migration System**: ORM-agnostic migration framework
2. **Seeding**: Unified seeding interface
3. **Connection Pooling**: Advanced pool management
4. **Query Logging**: Centralized query logging
5. **Performance Monitoring**: Query performance tracking
6. **Schema Builder**: Programmatic schema definition
7. **Multi-tenancy**: Support for multi-tenant databases