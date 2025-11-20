# @frouvel/kaname

Core framework modules for frourio-framework, inspired by Laravel's Illuminate namespace.

## Modules

### Testing (`@frouvel/kaname/testing`)

Comprehensive testing utilities including:
- **Test Case Classes**: `TestCase`, `TestCaseDatabase`, `TestCaseIntegration`
- **Factory Pattern**: Generate test data with `Factory` and `fake` helpers
- **API Client**: Fluent HTTP request interface for integration tests
- **Assertions**: Rich assertion helpers for API responses

[📖 Testing Documentation](./testing/README.md)

## Modules

### Console

PHP Artisan-like command line interface for managing your application.

**Features:**

- Base Command class for creating custom commands
- Automatic command registration via service providers
- Built-in helper methods for console output
- Support for arguments and options
- Type-safe command signatures

**Quick Start:**

```bash
npm run artisan inspire
npm run artisan config:cache
npm run artisan greet "John" --title "Dr."
```

[📖 Full Documentation](console/README.md)

### Foundation

Application container and kernel management inspired by Laravel.

**Includes:**

- [`Application`](foundation/Application.ts) - IoC container for dependency injection
- [`HttpKernel`](foundation/HttpKernel.ts) - HTTP request handling
- [`ConsoleKernel`](foundation/ConsoleKernel.ts) - Console command handling
- Bootstrappers for application initialization

### HTTP

HTTP response utilities and error handling.

**Features:**

- RFC9457-compliant error responses via [`ApiResponse`](http/ApiResponse.ts)
- Fluent [`ResponseBuilder`](http/ResponseBuilder.ts) API for validation
- Structured error classes

### Error

Structured error handling with automatic RFC9457 conversion.

**Includes:**

- [`FrourioFrameworkError`](error/FrourioFrameworkError.ts) - Base error class
- [`CommonErrors`](error/CommonErrors.ts) - Pre-defined error types

### Hash

Password hashing utilities.

**Features:**

- Strategy pattern for multiple hashing algorithms
- Bcrypt implementation included

### Paginator

Pagination utilities for list endpoints.

**Features:**

- [`createPaginationMeta`](paginator/createPaginationMeta.ts) - Generate pagination metadata

### Swagger

Automatic OpenAPI specification generation and Swagger UI integration.

**Features:**

- Automatic OpenAPI 3.0 spec generation from aspida types
- Interactive Swagger UI for API documentation
- JSDoc comment parsing for rich documentation
- Custom tag descriptions and grouping
- Framework-level integration via service provider
- RFC9457 ProblemDetails schema support
- OpenAPI spec file generation command

**Quick Start:**

```bash
# Access Swagger UI
http://localhost:{PORT}/api-docs

# Generate OpenAPI spec file
npm run artisan openapi:generate          # YAML (default)
npm run artisan openapi:generate -f json  # JSON format

# Configure via environment
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs
SWAGGER_TITLE=My API
```

**Enhanced Documentation with JSDoc:**

```typescript
/**
 * Get user by ID
 * @description Retrieves user details
 * @tag Users
 */
export type Methods = DefineMethods<{
  get: {
    resBody: UserDto | ProblemDetails;
  };
}>;
```

[📖 Full Documentation](swagger/README.md) | [📘 Usage Guide](swagger/USAGE_GUIDE.md)

### Validation

Zod-based validation utilities.

**Features:**

- [`Validator`](validation/Validator.ts) - Validation helper class

## Installation

These modules are part of the frourio-framework and are already available in your project under `$/@frouvel/kaname`.

## Usage Examples

### Creating a Console Command

```typescript
import { Command, type CommandSignature } from '$/@frouvel/kaname/console';

export class MyCommand extends Command {
  protected signature(): CommandSignature {
    return {
      name: 'my:command',
      description: 'My custom command',
    };
  }

  async handle(): Promise<void> {
    this.info('Running my command...');
    this.success('Done!');
  }
}
```

### Using the Application Container

```typescript
import app from '$/bootstrap/app';

// Bind a service
app.singleton('myService', () => new MyService());

// Resolve a service
const service = app.make<MyService>('myService');
```

### Creating HTTP Responses

```typescript
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';

// Success response
return ApiResponse.success({ id: 1, name: 'John' });

// Error responses
return ApiResponse.notFound('User not found', { userId: '123' });
return ApiResponse.badRequest('Invalid input');
```

## Philosophy

@frouvel/kaname follows these principles:

1. **Laravel-inspired**: Familiar patterns for developers coming from Laravel
2. **Type-safe**: Full TypeScript support with strong typing
3. **Modular**: Use only what you need
4. **DDD-friendly**: Supports Domain-Driven Design patterns
5. **Framework-agnostic**: Core utilities can be used independently

## Documentation

- [Console Commands](console/README.md)
- [Foundation](foundation/README.md)
- [Swagger/OpenAPI](swagger/README.md)
- [HTTP Response Handling](docs/RFC9457_QUICK_START.md)
- [Error Handling](docs/RFC9457_ERROR_HANDLING.md)
- [Response Builder](docs/RESPONSE_BUILDER.md)

## Contributing

When adding new modules to @frouvel/kaname:

1. Follow existing patterns and conventions
2. Include comprehensive TypeScript types
3. Add documentation with examples
4. Write tests for new functionality
5. Update this README with the new module

## License

ISC

- かつてfrourioで受託開発をしていた際のチーム名がkaname-devでした.
- 由来は「すずめの戸締まり」の要石で, 炎上したプロジェクトでも１人で鎮火するという意味が込められています.
- 転じて, 炎上とは無縁のモジュール群を提供したいという思いで作られています.
- Laravelで例えると, Illuminate相当のnamespaceです.

## Available Modules

### HTTP Response Module (`@frouvel/kaname/http`)

RFC9457-compliant error responses and response building utilities.

- **ApiResponse**: Unified API for creating HTTP responses
- **ResponseBuilder**: Fluent API for validation and response creation

### Hash Module (`@frouvel/kaname/hash`)

Password hashing operations inspired by Laravel's Hash facade with Strategy Pattern support.

```ts
import { Hash } from '$/@frouvel/kaname/hash/Hash';

// Hash a password (default: bcrypt)
const hashed = await Hash.make('secret123');

// Verify a password
const isValid = await Hash.check('secret123', hashed);

// Custom bcrypt rounds
const strongHash = await Hash.make('secret123', { rounds: 12 });

// Alternative syntax
const isValid2 = await Hash.verify('secret123', hashed);
```

**Strategy Pattern Support:**

```ts
import { Hash } from '$/@frouvel/kaname/hash';
import { BcryptHashStrategy } from '$/@frouvel/kaname/hash/strategies';

// Set custom strategy with options
Hash.setStrategy(new BcryptHashStrategy({ rounds: 12 }));

// Check current strategy
console.log(Hash.getStrategyName()); // 'bcrypt'

// Create your own strategy by implementing IHashStrategy
// See hash/README.md for detailed examples
```

### Error Module (`@frouvel/kaname/error`)

Structured error classes that automatically convert to RFC9457 Problem Details.

### Validation Module (`@frouvel/kaname/validation`)

Zod-based validation utilities.

### Swagger Module (`@frouvel/kaname/swagger`)

Automatic OpenAPI 3.0 specification generation from aspida type definitions with Swagger UI.

**Features:**
- Auto-generates OpenAPI spec from aspida types
- Parses JSDoc comments for rich documentation
- Custom tag descriptions via [`config/swagger.ts`](../../config/swagger.ts)
- Interactive Swagger UI
- OpenAPI spec file generation command

```ts
// Automatically enabled in development via SwaggerServiceProvider
// Access at http://localhost:8080/api-docs

// Configure via environment variables or config/swagger.ts
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs
SWAGGER_TITLE=My API

// Generate OpenAPI spec file
npm run artisan openapi:generate
npm run artisan openapi:generate -f json
```

**JSDoc Enhancement:**
```typescript
/**
 * @tag Users
 * @description User management endpoint
 */
export type Methods = DefineMethods<{
  get: { resBody: UserDto | ProblemDetails };
}>;
```

### Paginator Module (`@frouvel/kaname/paginator`)

Pagination utilities for creating consistent pagination responses.
