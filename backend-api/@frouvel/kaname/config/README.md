# Configuration Module

Laravel-inspired configuration system for Frourio Framework.

## Overview

This module provides a centralized configuration management system with:

- **Dot Notation Access**: Access nested config values easily
- **Configuration Caching**: Cache configs for production performance
- **Type Safety**: Full TypeScript support
- **Environment Integration**: Seamless integration with environment variables

## Quick Start

### Basic Usage

```typescript
import { config } from '$/@frouvel/kaname/config';

// Get configuration values
const appName = config('app.name');
const jwtSecret = config('jwt.secret');
const dbUrl = config('database.connections.postgresql.url');

// With default values
const customValue = config('app.customKey', 'default-value');
```

### Type-Safe Access

```typescript
import { config } from '$/@frouvel/kaname/config';

// Explicitly typed
const debug = config<boolean>('app.debug');
const port = config<number>('database.pool.max');

// With interfaces
interface JwtConfig {
  secret: string;
  expiresIn: number;
}

const jwtConfig = config<JwtConfig>('jwt');
```

## API Reference

### `config<T>(key: string, defaultValue?: T): T`

Get a configuration value using dot notation.

**Parameters:**
- `key`: Configuration key in dot notation (e.g., `'app.name'`)
- `defaultValue`: Optional default value if key doesn't exist

**Returns:** Configuration value or default value

**Examples:**

```typescript
// Simple access
config('app.name') // 'Frourio Framework'

// Nested access
config('database.connections.postgresql.url') // 'postgresql://...'

// With default
config('app.nonExistent', 'fallback') // 'fallback'

// Type-safe
config<number>('jwt.expiresIn') // 86400
```

### `hasConfig(key: string): boolean`

Check if a configuration key exists.

**Parameters:**
- `key`: Configuration key in dot notation

**Returns:** `true` if the key exists, `false` otherwise

**Examples:**

```typescript
hasConfig('app.name') // true
hasConfig('nonexistent.key') // false

if (hasConfig('app.debug')) {
  console.log('Debug mode is configured');
}
```

### `configAll(file: string): Record<string, any> | undefined`

Get all configuration values for a specific file.

**Parameters:**
- `file`: Configuration file name without extension

**Returns:** All config values for that file, or `undefined` if not found

**Examples:**

```typescript
const appConfig = configAll('app');
// { name: '...', env: '...', debug: true, ... }

const jwtConfig = configAll('jwt');
// { secret: '...', expiresIn: 86400, ... }
```

## Configuration Files

All configuration files are located in `backend-api/config/`:

- **`app.ts`**: Application settings (name, environment, debug mode)
- **`admin.ts`**: Admin credentials and settings
- **`cors.ts`**: CORS configuration
- **`database.ts`**: Database connections and settings
- **`jwt.ts`**: JWT authentication configuration

See [`backend-api/config/README.md`](../../../config/README.md) for detailed information about each configuration file.

## Configuration Caching

For production environments, cache your configuration to improve performance:

```bash
# Cache configuration
npm run artisan config:cache

# Clear configuration cache
npm run artisan config:clear
```

When cached, configuration is loaded from `bootstrap/cache/config.cache.json` instead of parsing individual files.

## Usage Examples

### In Controllers

```typescript
import { config } from '$/@frouvel/kaname/config';
import { defineController } from './$relay';

export default defineController(() => ({
  get: () => {
    const appName = config('app.name');
    return { message: `Welcome to ${appName}` };
  },
}));
```

### In Services

```typescript
import { config } from '$/@frouvel/kaname/config';

export class EmailService {
  private readonly sender: string;

  constructor() {
    this.sender = config('mail.from', 'noreply@example.com');
  }

  async send(to: string, subject: string, body: string) {
    // Use this.sender...
  }
}
```

### In UseCases

```typescript
import { config } from '$/@frouvel/kaname/config';

export class CreateUserUseCase {
  async handle(data: CreateUserDto) {
    const maxUsers = config<number>('app.maxUsers', 1000);
    
    if (await this.userCount() >= maxUsers) {
      throw new Error('Maximum users reached');
    }
    
    // Create user...
  }
}
```

## Best Practices

1. **Always provide defaults** for non-critical configuration values
2. **Use type parameters** for type safety: `config<number>('app.timeout')`
3. **Cache in production** for better performance
4. **Never hardcode secrets** - use environment variables
5. **Document your configurations** with JSDoc comments

## Integration with Application Container

The configuration is registered as a singleton in the Application container:

```typescript
import app from '$/bootstrap/app';

// Direct access via container
const configs = app.make<Record<string, any>>('config');

// Or use the helper (recommended)
import { config } from '$/@frouvel/kaname/config';
const value = config('key');
```

## See Also

- [Configuration Files Documentation](../../../config/README.md)
- [Application Container](../foundation/README.md)