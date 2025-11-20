# @frouvel/kaname/foundation

Laravel-inspired application foundation framework for frourio-framework.

This module provides the core application bootstrap system, inspired by Laravel's `Illuminate\Foundation` namespace.

## Overview

The bootstrap system provides a structured way to initialize and configure your application, similar to Laravel's bootstrap process. It follows the same flow for both HTTP and CLI entry points:

```
bootstrap/app.ts creates Application → Kernel bootstraps → Request/Command handling
```

## Directory Structure

```
@frouvel/kaname/foundation/
├── index.ts                    # Foundation module exports
├── Application.ts              # Application container (IoC container)
├── Kernel.ts                   # Base kernel class
├── HttpKernel.ts              # HTTP request kernel
├── ConsoleKernel.ts           # Console command kernel
├── Bootstrapper.interface.ts  # Bootstrapper contract
├── bootstrappers/             # Application bootstrappers
│   ├── LoadEnvironmentVariables.ts  # Loads .env file
│   ├── LoadConfiguration.ts         # Loads config files (with caching)
│   ├── HandleExceptions.ts          # Sets up exception handlers
│   ├── RegisterProviders.ts         # Registers service providers
│   ├── BootProviders.ts            # Boots service providers
│   └── index.ts
└── README.md                  # This file

Application-specific:
backend-api/
├── @frouvel/kaname/foundation/providers/  # Framework providers
│   ├── DatabaseServiceProvider.ts
│   └── ConsoleServiceProvider.ts
├── app/providers/             # Application providers
│   └── AppServiceProvider.ts
└── bootstrap/
    ├── app.ts                 # Application entry point
    └── cache/                 # Bootstrap cache files
```

## Bootstrap Flow

### 1. Application Creation (`backend-api/bootstrap/app.ts`)

The entry point creates an Application instance and binds the HttpKernel and ConsoleKernel:

```typescript
import { Application, HttpKernel, ConsoleKernel } from '$/@frouvel/kaname/foundation';

const app = new Application(basePath);
app.singleton('HttpKernel', () => new HttpKernel(app));
app.singleton('ConsoleKernel', () => new ConsoleKernel(app));
```

### 2. Kernel Bootstrapping

When a kernel is invoked, it runs through these bootstrappers in order:

1. **LoadEnvironmentVariables** - Loads `.env` file
2. **LoadConfiguration** - Loads config files (or cache in production)
3. **HandleExceptions** - Sets up global exception handlers
4. **RegisterProviders** - Registers all service providers
5. **BootProviders** - Boots all registered providers

### 3. Request/Command Handling

- **HTTP**: Fastify instance is created and configured
- **CLI**: Commander.js commands are registered and executed

## Usage

### HTTP Entry Point

```typescript
// entrypoints/index.ts
import app from '$/bootstrap/app';
import type { HttpKernel } from '$/@frouvel/kaname/foundation';

const kernel = app.make<HttpKernel>('HttpKernel');
const fastify = await kernel.handle();
fastify.listen({ port: 8080, host: '0.0.0.0' });
```

### Console Entry Point

```typescript
// consoleCommands/cli/index.ts
import app from '$/bootstrap/app';
import type { ConsoleKernel } from '$/@frouvel/kaname/foundation';

const kernel = app.make<ConsoleKernel>('ConsoleKernel');
await kernel.bootstrap();
// Register and run commands
```

## Application Container

The Application class provides an IoC (Inversion of Control) container for dependency injection:

### Binding Services

```typescript
import { getPrismaClient } from '$/@frouvel/kaname/database';

// Bind a service (creates new instance each time)
app.bind('myService', () => new MyService());

// Bind a singleton (same instance every time)
app.singleton('prisma', () => getPrismaClient());
```

### Resolving Services

```typescript
// Resolve a service
const service = app.make('myService');

// Check if service exists
if (app.has('myService')) {
  // ...
}
```

## Service Providers

Service providers are classes that register and boot services with the application.

### Creating a Service Provider

```typescript
import type { ServiceProvider, Application } from '$/@frouvel/kaname/foundation';

export class MyServiceProvider implements ServiceProvider {
  register(app: Application): void {
    // Register services in the container
    app.singleton('myService', () => new MyService());
  }

  async boot(app: Application): Promise<void> {
    // Boot services (runs after all providers are registered)
    const service = app.make('myService');
    await service.initialize();
  }
}
```

### Registering Providers

Register your provider in your application's bootstrap file:

```typescript
// bootstrap/app.ts
import {
  DatabaseServiceProvider,
  ConsoleServiceProvider,
} from '$/@frouvel/kaname/foundation';
import { AppServiceProvider } from '$/app/providers/AppServiceProvider';

// After creating the application
const providers = [
  // Framework providers
  DatabaseServiceProvider,
  ConsoleServiceProvider,
  
  // Application providers
  AppServiceProvider,
];

providers.forEach(Provider => {
  const provider = new Provider();
  app.register(provider);
});
```

## Configuration Caching

For improved performance in production, you can cache your configuration:

### Cache Configuration

```bash
npm run artisan config:cache
```

This creates `bootstrap/cache/config.cache.json` which is automatically loaded in production.

### Clear Configuration Cache

```bash
npm run artisan config:clear
```

## Creating Custom Bootstrappers

Implement the `Bootstrapper` interface:

```typescript
import type { Bootstrapper, Application } from '$/@frouvel/kaname/foundation';

export class MyBootstrapper implements Bootstrapper {
  async bootstrap(app: Application): Promise<void> {
    // Your bootstrap logic here
    console.log('[Bootstrap] My custom bootstrapper');
  }
}
```

Add it to the kernel's `getBootstrappers()` method:

```typescript
protected getBootstrappers(): Array<new () => Bootstrapper> {
  return [
    LoadEnvironmentVariables,
    LoadConfiguration,
    MyBootstrapper, // Add here
    HandleExceptions,
    RegisterProviders,
    BootProviders,
  ];
}
```

## Environment Detection

The Application provides helper methods for environment detection:

```typescript
app.environment();      // Returns: 'development' | 'production' | 'test'
app.isProduction();     // true if NODE_ENV === 'production'
app.isDevelopment();    // true if NODE_ENV === 'development'
app.isTesting();        // true if NODE_ENV === 'test'
```

## Path Helpers

```typescript
app.basePath();         // /path/to/backend-api
app.basePath('config'); // /path/to/backend-api/config
app.configPath();       // /path/to/backend-api/config
app.bootstrapPath();    // /path/to/backend-api/bootstrap/cache
```

## Best Practices

1. **Service Providers**: Use for grouping related service registrations
2. **Bootstrappers**: Use for application-level initialization logic
3. **Configuration Caching**: Always cache configuration in production
4. **Dependency Injection**: Prefer constructor injection over direct imports
5. **Environment Variables**: Load early via LoadEnvironmentVariables bootstrapper

## Comparison with Laravel

| Laravel | frourio-framework |
|---------|------------------|
| `bootstrap/app.php` | `backend-api/bootstrap/app.ts` |
| `Illuminate\Foundation\Application` | `@frouvel/kaname/foundation/Application` |
| `App\Http\Kernel` | `@frouvel/kaname/foundation/HttpKernel` |
| `App\Console\Kernel` | `@frouvel/kaname/foundation/ConsoleKernel` |
| `ServiceProvider` | `@frouvel/kaname/foundation/ServiceProvider` |
| `php artisan config:cache` | `npm run artisan config:cache` |
| `php artisan config:clear` | `npm run artisan config:clear` |

## Example: Full Application Lifecycle

```typescript
// 1. Create application
const app = new Application('/path/to/backend-api');

// 2. Bind kernels
app.singleton('HttpKernel', () => new HttpKernel(app));

// 3. Resolve kernel
const kernel = app.make<HttpKernel>('HttpKernel');

// 4. Bootstrap (runs all bootstrappers)
await kernel.bootstrap();

// 5. Handle request
const fastify = await kernel.handle();

// 6. Start server
fastify.listen({ port: 8080 });
```

## Troubleshooting

### Configuration not loading

- Ensure config files are in `backend-api/config/`
- Check if config cache is stale (run `config:clear`)
- Verify configuration export format

### Service not found

- Check if service provider is registered
- Ensure provider's `register()` method binds the service
- Verify service key matches resolution key

### Bootstrap errors

- Check bootstrapper order (some depend on others)
- Review console output for specific error messages
- Ensure environment variables are loaded before configuration