# Testing Module

Comprehensive testing utilities for the frourio-framework, providing a clean and expressive API for writing integration tests.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Test Cases](#test-cases)
  - [TestCase](#testcase)
  - [TestCaseDatabase](#testcasedatabase)
  - [TestCaseIntegration](#testcaseintegration)
- [Factories](#factories)
- [API Client](#api-client)
- [Setup & Configuration](#setup--configuration)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The testing module provides:

- **Test Case Base Classes**: Structured testing with lifecycle hooks
- **Database Management**: Automatic migrations, seeding, and cleanup
- **Integration Testing**: Full HTTP server testing with Fastify inject
- **Factory Pattern**: Generate test data easily
- **API Client**: Fluent interface for making HTTP requests
- **Assertions**: Rich assertion helpers for API testing

## Installation

The testing module is already included in the `@frouvel/kaname` framework. No additional installation required.

## Quick Start

### 1. Configure Vitest

Your `vite.config.mts` should use the framework setup:

```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ['@frouvel/kaname/testing/setup.ts'],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
    },
  },
});
```

### 2. Create Your First Test

```typescript
import { TestCaseIntegration } from '$/@frouvel/kaname/testing';
import { expect } from 'vitest';

class MyFirstTest extends TestCaseIntegration {
  run() {
    this.suite('My First Test Suite', () => {
      this.test('can make a request', async () => {
        const response = await this.get('/api/health');
        this.assertOk(response);
        expect(response.body).toHaveProperty('status');
      });
    });
  }
}

new MyFirstTest().run();
```

### 3. Run Tests

```bash
npm test
```

## Test Cases

### TestCase

Base class for all tests. Provides lifecycle hooks and test organization.

```typescript
import { TestCase } from '$/@frouvel/kaname/testing';

class MyTest extends TestCase {
  protected async setUpBeforeClass(): Promise<void> {
    // Runs once before all tests in the suite
  }

  protected async tearDownAfterClass(): Promise<void> {
    // Runs once after all tests in the suite
  }

  protected async setUp(): Promise<void> {
    // Runs before each test
  }

  protected async tearDown(): Promise<void> {
    // Runs after each test
  }

  run() {
    this.suite('My Test Suite', () => {
      this.test('my test', () => {
        expect(true).toBe(true);
      });

      this.skip('skipped test', () => {
        // This test will be skipped
      });

      this.only('only this test runs', () => {
        // Only this test will run
      });
    });
  }
}

new MyTest().run();
```

### TestCaseDatabase

Extends `TestCase` with database functionality. Automatically handles migrations and cleanup.

```typescript
import { TestCaseDatabase } from '$/@frouvel/kaname/testing';
import { expect } from 'vitest';

class MyDatabaseTest extends TestCaseDatabase {
  protected async seed(): Promise<void> {
    // Seed data before each test
    await this.prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
      },
    });
  }

  run() {
    this.suite('Database Operations', () => {
      this.test('can query database', async () => {
        const users = await this.prisma.user.findMany();
        expect(users).toHaveLength(1);
      });

      this.test('database is refreshed between tests', async () => {
        // Each test starts fresh
        const users = await this.prisma.user.findMany();
        expect(users).toHaveLength(1); // Only seeded data
      });

      this.test('can use transactions', async () => {
        await this.transaction(async (tx) => {
          await tx.user.create({
            data: {
              name: 'Transaction User',
              email: 'tx@example.com',
              age: 30,
            },
          });
        });
      });
    });
  }
}

new MyDatabaseTest().run();
```

### TestCaseIntegration

Extends `TestCaseDatabase` with full HTTP server testing capabilities.

```typescript
import { TestCaseIntegration } from '$/@frouvel/kaname/testing';
import { expect } from 'vitest';

class MyIntegrationTest extends TestCaseIntegration {
  run() {
    this.suite('API Integration Tests', () => {
      this.test('can make HTTP requests', async () => {
        const response = await this.get('/api/users');
        this.assertOk(response);
      });

      this.test('can create resources', async () => {
        const response = await this.post('/api/users', {
          name: 'New User',
          email: 'new@example.com',
          age: 25,
        });
        this.assertCreated(response);
      });

      this.test('can use authentication', async () => {
        const token = 'my-jwt-token';
        const response = await this.get(
          '/api/protected',
          this.authHeader(token),
        );
        this.assertOk(response);
      });
    });
  }
}

new MyIntegrationTest().run();
```

## Factories

Generate test data easily with the factory pattern.

### Simple Factory

```typescript
import { defineFactory, fake } from '$/@frouvel/kaname/testing';

const userFactory = defineFactory(() => ({
  name: fake.name(),
  email: fake.email(),
  age: fake.number(18, 80),
}));

// Use in tests
const user = userFactory();
const userWithOverrides = userFactory({ name: 'Specific Name' });
```

### Fake Data Generators

```typescript
import { fake } from '$/@frouvel/kaname/testing';

fake.string(10);           // Random string
fake.email();              // Random email
fake.number(1, 100);       // Random number between 1-100
fake.boolean();            // Random boolean
fake.uuid();               // Random UUID
fake.date();               // Random date
fake.name();               // Random name
fake.text(10);             // Random text with 10 words
fake.pick(['a', 'b', 'c']); // Pick random element
```

### Sequences

```typescript
import { Sequence } from '$/@frouvel/kaname/testing';

// Generate sequential values
const userId = Sequence.next('user'); // 1
const userId2 = Sequence.next('user'); // 2

// Reset sequence
Sequence.reset('user');
```

### Advanced Factory (with Prisma)

```typescript
import { Factory } from '$/@frouvel/kaname/testing';
import type { PrismaClient } from '@prisma/client';

class UserFactory extends Factory<{
  name: string;
  email: string;
  age: number;
}> {
  protected definition() {
    return {
      name: fake.name(),
      email: fake.email(),
      age: fake.number(18, 80),
    };
  }

  async create(overrides?: any) {
    const data = this.make(overrides);
    return this.prisma!.user.create({ data });
  }
}

// Use in tests
const factory = new UserFactory(prisma);
const user = await factory.create();
const users = await factory.times(5).create();
```

## API Client

The `TestApiClient` provides a fluent interface for making HTTP requests in tests.

```typescript
import { TestApiClient } from '$/@frouvel/kaname/testing';

const client = new TestApiClient(server);

// Basic requests
await client.get('/api/users');
await client.post('/api/users', { name: 'User' });
await client.put('/api/users/1', { name: 'Updated' });
await client.patch('/api/users/1', { name: 'Patched' });
await client.delete('/api/users/1');

// With headers
await client
  .withHeaders({ 'X-Custom': 'value' })
  .get('/api/users');

// With authentication
await client
  .withBearerToken('jwt-token')
  .get('/api/protected');

// Assertions
const response = await client.get('/api/users');
client.assertOk(response);
client.assertStatus(response, 200);
client.assertCreated(response);
client.assertNotFound(response);
client.assertUnauthorized(response);
client.assertResponseContains(response, { name: 'User' });
client.assertHasPagination(response);
client.assertProblemDetails(response);
```

## Setup & Configuration

### Test Environment Options

```typescript
import { setupTestEnvironment } from '$/@frouvel/kaname/testing';

setupTestEnvironment({
  startServer: true,          // Start test server
  runMigrations: true,        // Run database migrations
  refreshDatabase: true,      // Refresh DB before each test
  port: 8091,                // Custom test server port
  seed: async () => {        // Custom seed function
    // Seed test data
  },
});
```

### Environment Variables

Create a `.env.test` file:

```env
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
API_SERVER_PORT=8080
```

## Best Practices

### 1. Name Tests Descriptively

```typescript
// ❌ Bad
this.test('test 1', async () => { ... });

// ✅ Good
this.test('GET /api/users returns paginated users', async () => { ... });
```

### 2. Use File Naming Convention

```typescript
// Integration tests
tests/integration/users.integration.test.ts

// Unit tests
tests/unit/services/UserService.test.ts
```

### 3. Seed Data in setUp/seed Methods

```typescript
class MyTest extends TestCaseIntegration {
  protected async seed(): Promise<void> {
    // Seed data here
    await this.prisma.user.createMany({ ... });
  }
}
```

### 4. Use Assertion Helpers

```typescript
// ❌ Less expressive
expect(response.status).toBe(200);

// ✅ More expressive
this.assertOk(response);
this.assertCreated(response);
this.assertNotFound(response);
```

### 5. Test One Thing Per Test

```typescript
// ❌ Testing too much
this.test('user CRUD', async () => {
  // Create, read, update, delete all in one test
});

// ✅ One concern per test
this.test('can create user', async () => { ... });
this.test('can read user', async () => { ... });
this.test('can update user', async () => { ... });
this.test('can delete user', async () => { ... });
```

## Examples

### Testing with Authentication

```typescript
class AuthTest extends TestCaseIntegration {
  private token?: string;

  protected async setUp(): Promise<void> {
    await super.setUp();
    
    // Login and get token
    const response = await this.post('/api/auth/login', {
      email: 'admin@test.com',
      password: 'password',
    });
    
    this.token = response.body.token;
  }

  run() {
    this.suite('Protected Routes', () => {
      this.test('requires authentication', async () => {
        const response = await this.get('/api/protected');
        this.assertUnauthorized(response);
      });

      this.test('allows authenticated requests', async () => {
        const response = await this.get(
          '/api/protected',
          this.authHeader(this.token!),
        );
        this.assertOk(response);
      });
    });
  }
}
```

### Testing Pagination

```typescript
class PaginationTest extends TestCaseIntegration {
  protected async seed(): Promise<void> {
    // Create 25 users
    await this.prisma.user.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        age: 20 + i,
      })),
    });
  }

  run() {
    this.suite('Pagination', () => {
      this.test('returns first page', async () => {
        const response = await this.get('/api/users?page=1&limit=10');
        
        this.assertOk(response);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.meta.currentPage).toBe(1);
        expect(response.body.meta.totalPages).toBe(3);
        expect(response.body.meta.totalCount).toBe(25);
      });

      this.test('returns last page', async () => {
        const response = await this.get('/api/users?page=3&limit=10');
        
        this.assertOk(response);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.meta.currentPage).toBe(3);
      });
    });
  }
}
```

### Testing Error Responses (RFC9457)

```typescript
class ErrorHandlingTest extends TestCaseIntegration {
  run() {
    this.suite('Error Handling', () => {
      this.test('returns RFC9457 Problem Details', async () => {
        const response = await this.get('/api/users/invalid-id');
        
        this.assertNotFound(response);
        expect(response.body).toMatchObject({
          type: expect.any(String),
          title: expect.any(String),
          status: 404,
          detail: expect.any(String),
        });
      });

      this.test('handles validation errors', async () => {
        const response = await this.post('/api/users', {
          name: '',  // Invalid
          email: 'not-an-email',  // Invalid
          age: -1,  // Invalid
        });
        
        expect([400, 422]).toContain(response.status);
        expect(response.body.type).toContain('validation');
      });
    });
  }
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/integration/users.integration.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Troubleshooting

### Database Connection Issues

Ensure `TEST_DATABASE_URL` is set in your environment:

```env
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
```

### Port Already in Use

The test server uses `API_SERVER_PORT + 11`. If this port is busy, change it in your test environment configuration.

### Migration Failures

Reset the test database:

```bash
npx prisma migrate reset --force
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html)
