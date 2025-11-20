# Migration Guide: Moving to Framework Testing

This guide helps you migrate from the old `tests/setup.ts` to the new `@frouvel/kaname/testing` framework.

## Quick Migration

### 1. Update `vite.config.mts`

**Before:**
```typescript
export default defineConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    // ...
  },
});
```

**After:**
```typescript
export default defineConfig({
  test: {
    setupFiles: ['@frouvel/kaname/testing/setup.ts'],
    // ...
  },
});
```

### 2. Migrate Test Files

**Before (Old Setup Style):**
```typescript
import { expect, it, describe } from 'vitest';

describe('Users API', () => {
  it('returns users', async () => {
    // Test logic
  });
});
```

**After (New TestCase Style):**
```typescript
import { TestCaseIntegration } from '$/@frouvel/kaname/testing';
import { expect } from 'vitest';

class UsersTest extends TestCaseIntegration {
  run() {
    this.suite('Users API', () => {
      this.test('returns users', async () => {
        const response = await this.get('/api/users');
        this.assertOk(response);
      });
    });
  }
}

new UsersTest().run();
```

## Detailed Migration Steps

### Step 1: Remove Old Test Setup

You can safely remove `tests/setup.ts` as it's now handled by the framework:

```bash
rm tests/setup.ts
```

### Step 2: Create Integration Test Directory

```bash
mkdir -p tests/integration
```

### Step 3: Migrate Individual Test Files

#### Example: Migrating a Database Test

**Before:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getPrismaClient } from '$/service/getPrismaClient';

const prisma = getPrismaClient();

describe('User Repository', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('creates a user', async () => {
    const user = await prisma.user.create({
      data: { name: 'Test', email: 'test@test.com', age: 25 }
    });
    expect(user).toBeDefined();
  });
});
```

**After:**
```typescript
import { TestCaseDatabase } from '$/@frouvel/kaname/testing';
import { expect } from 'vitest';

class UserRepositoryTest extends TestCaseDatabase {
  run() {
    this.suite('User Repository', () => {
      this.test('creates a user', async () => {
        const user = await this.prisma.user.create({
          data: { name: 'Test', email: 'test@test.com', age: 25 }
        });
        expect(user).toBeDefined();
      });
    });
  }
}

new UserRepositoryTest().run();
```

#### Example: Migrating an API Integration Test

**Before:**
```typescript
import { describe, it, expect } from 'vitest';

describe('Users API', () => {
  it('GET /api/users returns users', async () => {
    const response = await fetch('http://localhost:8091/api/users');
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });
});
```

**After:**
```typescript
import { TestCaseIntegration } from '$/@frouvel/kaname/testing';
import { expect } from 'vitest';

class UsersApiTest extends TestCaseIntegration {
  run() {
    this.suite('Users API', () => {
      this.test('GET /api/users returns users', async () => {
        const response = await this.get('/api/users');
        this.assertOk(response);
        expect(response.body).toHaveProperty('data');
      });
    });
  }
}

new UsersApiTest().run();
```

### Step 4: File Naming Convention

Rename your test files to follow the new convention:

```bash
# Integration tests
mv tests/users.test.ts tests/integration/users.integration.test.ts

# Unit tests
mv tests/services/user.test.ts tests/unit/services/user.test.ts
```

## Benefits of Migration

### 1. Better Test Organization

**Before:**
- Mixed lifecycle hooks (beforeEach, afterEach)
- Manual database cleanup
- No consistent structure

**After:**
- Clean class-based organization
- Automatic database cleanup
- Consistent lifecycle hooks

### 2. Less Boilerplate

**Before:**
```typescript
import { beforeEach, afterEach } from 'vitest';
import { getPrismaClient } from '$/service/getPrismaClient';

const prisma = getPrismaClient();

beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.user.create({ data: { ... } });
});

afterEach(async () => {
  await prisma.$disconnect();
});
```

**After:**
```typescript
class MyTest extends TestCaseIntegration {
  protected async seed(): Promise<void> {
    await this.prisma.user.create({ data: { ... } });
  }
}
```

### 3. Rich Assertion Helpers

**Before:**
```typescript
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('data');
```

**After:**
```typescript
this.assertOk(response);
this.assertResponseContains(response, { data: expect.any(Array) });
```

### 4. Built-in HTTP Client

**Before:**
```typescript
const response = await fetch(`${baseUrl}/api/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(data),
});
```

**After:**
```typescript
const response = await this.post('/api/users', data, this.authHeader(token));
```

## Common Patterns

### Pattern 1: Setup Data

**Before:**
```typescript
let userId: string;

beforeEach(async () => {
  const user = await prisma.user.create({ ... });
  userId = user.id;
});
```

**After:**
```typescript
class MyTest extends TestCaseIntegration {
  private userId?: string;

  protected async setUp(): Promise<void> {
    await super.setUp();
    const user = await this.prisma.user.create({ ... });
    this.userId = user.id;
  }
}
```

### Pattern 2: Authentication

**Before:**
```typescript
let authToken: string;

beforeEach(async () => {
  const response = await fetch('/api/auth/login', { ... });
  const data = await response.json();
  authToken = data.token;
});
```

**After:**
```typescript
class MyTest extends TestCaseIntegration {
  private authToken?: string;

  protected async setUp(): Promise<void> {
    await super.setUp();
    const response = await this.post('/api/auth/login', { ... });
    this.authToken = response.body.token;
  }
}
```

### Pattern 3: Shared Test Data

**Before:**
```typescript
const testUser = {
  name: 'Test User',
  email: 'test@test.com',
  age: 25,
};

beforeEach(async () => {
  await prisma.user.create({ data: testUser });
});
```

**After:**
```typescript
class MyTest extends TestCaseIntegration {
  protected async seed(): Promise<void> {
    await this.prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@test.com',
        age: 25,
      },
    });
  }
}
```

## Troubleshooting

### Issue: "Cannot find module '@frouvel/kaname/testing'"

**Solution:** Ensure your `tsconfig.json` includes the correct path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "$/*": ["./"]
    }
  }
}
```

### Issue: Database not cleaning between tests

**Solution:** Ensure your test file name includes `.integration.test.ts`:

```typescript
// ✅ Correct
users.integration.test.ts

// ❌ Wrong (won't trigger cleanup)
users.test.ts
```

### Issue: Server already running error

**Solution:** The test server uses `API_SERVER_PORT + 11`. Make sure this port is available or change it in the test configuration.

## Need Help?

- Check the [Testing README](./README.md) for full documentation
- Review example tests in `tests/integration/`
- Open an issue if you encounter problems

## Checklist

- [ ] Updated `vite.config.mts` to use framework setup
- [ ] Removed old `tests/setup.ts`
- [ ] Created `tests/integration/` directory
- [ ] Migrated all integration tests to `TestCaseIntegration`
- [ ] Renamed test files with `.integration.test.ts` suffix
- [ ] Updated imports to use `@frouvel/kaname/testing`
- [ ] Ran tests to verify everything works
- [ ] Removed manual database cleanup code
- [ ] Updated test documentation