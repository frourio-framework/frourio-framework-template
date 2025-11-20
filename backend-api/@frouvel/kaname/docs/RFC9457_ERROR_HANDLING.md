# RFC9457 Error Handling Guide

This guide explains how to implement RFC9457-compliant error handling in the Frourio Framework.

## Overview

[RFC9457](https://www.rfc-editor.org/rfc/rfc9457.html) defines a standard format for HTTP API error responses called "Problem Details". This implementation provides a consistent, machine-readable format for all error responses.

## Problem Details Format

All error responses follow this structure:

```json
{
  "type": "https://example.com/errors/not-found",
  "title": "NOT_FOUND",
  "status": 404,
  "detail": "User with ID 123 not found",
  "instance": "/users/123",
  "code": "NOT_FOUND",
  "timestamp": "2025-11-09T08:59:00.000Z"
}
```

### Core Fields

- **type** (required): URI identifying the problem type
- **title** (required): Short, human-readable summary
- **status** (required): HTTP status code
- **detail** (required): Human-readable explanation
- **instance** (optional): URI reference to the specific occurrence

### Extension Members

Additional fields can be added for context:
- **code**: Application-specific error code
- **timestamp**: When the error occurred
- Any custom fields relevant to your application

## Basic Usage

### 1. Using ApiResponse Facade

The simplest way to return RFC9457-compliant errors:

```typescript
import { defineController } from './$relay';
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';

export default defineController(() => ({
  get: ({ params }) => {
    try {
      const user = findUser(params.id);
      
      if (!user) {
        return ApiResponse.notFound(`User with ID ${params.id} not found`, {
          userId: params.id,
        });
      }
      
      return ApiResponse.success(user);
    } catch (error) {
      return ApiResponse.method.get(error);
    }
  },
  
  post: ({ body }) => {
    try {
      if (!body.email) {
        return ApiResponse.badRequest('Email is required', {
          field: 'email',
        });
      }
      
      const user = createUser(body);
      return ApiResponse.success(user);
    } catch (error) {
      return ApiResponse.method.post(error);
    }
  },
}));
```

### 2. Using Custom Error Classes

Create specific error types for your domain:

```typescript
import { NotFoundError, ValidationError } from '$/@frouvel/kaname/error/CommonErrors';
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';

export default defineController(() => ({
  get: ({ params }) => {
    try {
      const user = findUser(params.id);
      
      if (!user) {
        throw NotFoundError.create(`User with ID ${params.id} not found`, {
          userId: params.id,
          resource: 'User',
        });
      }
      
      return ApiResponse.success(user);
    } catch (error) {
      return ApiResponse.method.get(error);
    }
  },
}));
```

### 3. Creating Custom Error Classes

Extend `AbstractFrourioFrameworkError` for domain-specific errors:

```typescript
import { AbstractFrourioFrameworkError } from '$/@frouvel/kaname/error/FrourioFrameworkError';

export class UserAlreadyExistsError extends AbstractFrourioFrameworkError {
  constructor(args: {
    email: string;
    details?: Record<string, any>;
  }) {
    super({
      message: `User with email ${args.email} already exists`,
      code: 'USER_ALREADY_EXISTS',
      details: { email: args.email, ...args.details },
      typeUri: 'https://example.com/errors/user-already-exists',
    });
  }
  
  static create(email: string, details?: Record<string, any>) {
    return new UserAlreadyExistsError({ email, details });
  }
}

// Usage in controller
export default defineController(() => ({
  post: ({ body }) => {
    try {
      const existingUser = findUserByEmail(body.email);
      
      if (existingUser) {
        throw UserAlreadyExistsError.create(body.email, {
          existingUserId: existingUser.id,
        });
      }
      
      const user = createUser(body);
      return ApiResponse.success(user);
    } catch (error) {
      return ApiResponse.method.post(error);
    }
  },
}));
```

## ApiResponse Facade Methods

### Method-Specific Error Handlers

```typescript
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';

// Automatically determines status from error type
ApiResponse.method.get(error);      // Default: 404
ApiResponse.method.post(error);     // Default: 500
ApiResponse.method.put(error);      // Default: 500
ApiResponse.method.patch(error);    // Default: 403
ApiResponse.method.delete(error);   // Default: 500
```

### Specific Status Code Methods

```typescript
ApiResponse.badRequest(detail, extensions?);        // 400
ApiResponse.unauthorized(detail, extensions?);      // 401
ApiResponse.forbidden(detail, extensions?);         // 403
ApiResponse.notFound(detail, extensions?);          // 404
ApiResponse.conflict(detail, extensions?);          // 409
ApiResponse.internalServerError(detail, extensions?); // 500
```

### Example with Extensions

```typescript
return ApiResponse.notFound('Resource not found', {
  resourceType: 'User',
  resourceId: params.id,
  searchedAt: new Date().toISOString(),
});
```

## Common Error Classes

Pre-built error classes in `$/@frouvel/kaname/error/CommonErrors.ts`:

- **ValidationError** - For validation failures (400)
- **UnauthorizedError** - For authentication failures (401)
- **ForbiddenError** - For authorization failures (403)
- **NotFoundError** - For missing resources (404)
- **BadRequestError** - For malformed requests (400)
- **InternalServerError** - For unexpected errors (500)

## UseCase Integration

When using UseCases, errors bubble up and are handled in controllers:

```typescript
// In UseCase
export class FindUserByIdUseCase {
  async handle(args: { userId: string }) {
    const user = await this._userRepository.findById(args.userId);
    
    if (!user) {
      throw NotFoundError.create(`User with ID ${args.userId} not found`, {
        userId: args.userId,
      });
    }
    
    return user;
  }
}

// In Controller
export default defineController(() => ({
  get: ({ params }) =>
    FindUserByIdUseCase.create()
      .handle({ userId: params.userId })
      .then(returnSuccess)
      .catch(returnGetError),
}));
```

## Response Headers

RFC9457 responses include the appropriate Content-Type header:

```
Content-Type: application/problem+json
```

## Type Definitions

Error responses are properly typed:

```typescript
import type { ProblemDetails } from '$/app/http/rfc9457.types';

export type Methods = DefineMethods<{
  get: {
    resBody: User | ProblemDetails;
  };
}>;
```

## Best Practices

1. **Use specific error classes** - Create domain-specific errors for better semantics
2. **Include context** - Add relevant details in the `details` or extensions
3. **Consistent error codes** - Use the ErrorCode enum for application-wide consistency
4. **Set proper type URIs** - Provide documentation URLs in the `type` field
5. **Handle all errors** - Always catch and convert errors to RFC9457 format
6. **Log server errors** - Log 5xx errors for debugging while returning safe messages to clients
7. **Don't expose sensitive data** - Be careful what you include in error details

## Migration from Legacy Format

If you have existing error handling:

```typescript
// Old format
return { status: 404, body: { error: 'Not found' } };

// New RFC9457 format
return returnNotFound('Resource not found');
```

The old `toJSON()` method is deprecated but still available for backward compatibility.

## Example Responses

### Validation Error (400)

```json
{
  "type": "https://example.com/errors/validation",
  "title": "VALIDATION_ERROR",
  "status": 400,
  "detail": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-11-09T08:59:00.000Z",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "age",
      "message": "Must be at least 18"
    }
  ]
}
```

### Not Found Error (404)

```json
{
  "type": "https://example.com/errors/not-found",
  "title": "NOT_FOUND",
  "status": 404,
  "detail": "User with ID 123 not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-11-09T08:59:00.000Z",
  "userId": "123",
  "resource": "User"
}
```

### Unauthorized Error (401)

```json
{
  "type": "https://example.com/errors/unauthorized",
  "title": "UNAUTHORIZED",
  "status": 401,
  "detail": "Invalid credentials",
  "code": "UNAUTHORIZED",
  "timestamp": "2025-11-09T08:59:00.000Z",
  "reason": "Token expired"
}
```

## See Also

- [RFC9457 Specification](https://www.rfc-editor.org/rfc/rfc9457.html)
- [Example Controller](../api/example-rfc9457/controller.ts)
- [Error Type Definitions](../app/http/rfc9457.types.ts)
- [Response Helpers](../app/http/rfc9457.response.ts)