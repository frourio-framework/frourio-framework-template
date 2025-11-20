# RFC9457 Quick Start Guide

Quick reference for using RFC9457-compliant error handling in controllers.

## TL;DR

```typescript
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';
import { NotFoundError } from '$/@frouvel/kaname/error/CommonErrors';

export default defineController(() => ({
  get: ({ params }) => {
    try {
      const item = findItem(params.id);
      if (!item) {
        throw NotFoundError.create(`Item ${params.id} not found`, { itemId: params.id });
      }
      return ApiResponse.success(item);
    } catch (error) {
      return ApiResponse.method.get(error);
    }
  },
}));
```

## Quick Reference

### Import ApiResponse Facade

```typescript
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';

// Success response
ApiResponse.success(data);

// Method-specific error handlers (auto-detect status from error type)
ApiResponse.method.get(error);      // Default: 404
ApiResponse.method.post(error);     // Default: 500
ApiResponse.method.put(error);      // Default: 500
ApiResponse.method.patch(error);    // Default: 403
ApiResponse.method.delete(error);   // Default: 500

// Specific status code methods
ApiResponse.notFound(detail, extensions?);          // 404
ApiResponse.badRequest(detail, extensions?);        // 400
ApiResponse.unauthorized(detail, extensions?);      // 401
ApiResponse.forbidden(detail, extensions?);         // 403
ApiResponse.conflict(detail, extensions?);          // 409
ApiResponse.internalServerError(detail, extensions?); // 500
```

### Import Error Classes

```typescript
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  InternalServerError,
} from '$/@frouvel/kaname/error/CommonErrors';
```

## Common Patterns

### Pattern 1: Direct Return with ApiResponse

```typescript
post: ({ body }) => {
  if (!body.email) {
    return ApiResponse.badRequest('Email is required', { field: 'email' });
  }
  return ApiResponse.success({ created: true });
},
```

### Pattern 2: Throw Custom Error

```typescript
get: ({ params }) => {
  try {
    const user = findUser(params.id);
    if (!user) {
      throw NotFoundError.create(`User ${params.id} not found`, { userId: params.id });
    }
    return ApiResponse.success(user);
  } catch (error) {
    return ApiResponse.method.get(error);
  }
},
```

### Pattern 3: UseCase Integration

```typescript
post: ({ body }) =>
  CreateUserUseCase.create()
    .handle({ email: body.email })
    .then(ApiResponse.success)
    .catch(ApiResponse.method.post),
```

## Response Format

All errors return this structure:

```json
{
  "type": "https://example.com/errors/not-found",
  "title": "NOT_FOUND",
  "status": 404,
  "detail": "User 123 not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-11-09T09:00:00.000Z",
  "userId": "123"
}
```

## Headers

Responses include:
```
Content-Type: application/problem+json
```

## Type Definitions

```typescript
import type { ProblemDetails } from 'commonTypesWithClient';

export type Methods = DefineMethods<{
  get: {
    resBody: User | ProblemDetails;
  };
}>;
```

## See Full Documentation

[RFC9457 Error Handling Guide](./RFC9457_ERROR_HANDLING.md)