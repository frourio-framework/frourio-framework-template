# Backend API Documentation

## RFC9457 Error Handling

This project implements [RFC9457](https://www.rfc-editor.org/rfc/rfc9457.html)-compliant error handling for all HTTP API responses.

### Quick Links

- **[Quick Start Guide](./RFC9457_QUICK_START.md)** - Get started in 5 minutes
- **[Full Documentation](./RFC9457_ERROR_HANDLING.md)** - Complete guide with examples
- **[Frontend Usage Guide](./RFC9457_FRONTEND_USAGE.md)** - How to use on frontend with type guards
- **[Migration Guide](./RFC9457_MIGRATION.md)** - Migrate existing code
- **[Example Controller](../api/example-rfc9457/controller.ts)** - Working examples

### What is RFC9457?

RFC9457 defines a standard format for HTTP API error responses called "Problem Details". It provides:

- Machine-readable error format
- Human-readable descriptions
- Extensible structure for additional context
- Standard HTTP status codes

### Example Error Response

```json
{
  "type": "https://example.com/errors/not-found",
  "title": "NOT_FOUND",
  "status": 404,
  "detail": "User with ID 123 not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-11-09T09:00:00.000Z",
  "userId": "123"
}
```

### Quick Example

**Backend (index.ts):**

```typescript
import type { DefineMethods } from 'aspida';
import type { ApiResponse } from 'commonTypesWithClient';

type User = { id: number; name: string };

export type Methods = DefineMethods<{
  get: {
    resBody: ApiResponse<User>; // Automatically handles success | error
  };
}>;
```

**Backend (controller.ts):**

```typescript
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';
import { NotFoundError } from '$/@frouvel/kaname/error/CommonErrors';

export default defineController(() => ({
  get: ({ params }) => {
    try {
      const user = findUser(params.id);
      if (!user) {
        throw NotFoundError.create(`User ${params.id} not found`, {
          userId: params.id,
        });
      }
      return ApiResponse.success(user);
    } catch (error) {
      return ApiResponse.method.get(error);
    }
  },
}));
```

**Frontend:**

```typescript
import { isApiSuccess } from '@/commonTypesWithClient';

const response = await apiClient.users._id(123).$get();

if (isApiSuccess(response)) {
  // TypeScript knows response is User
  console.log(response.name);
} else {
  // TypeScript knows response is ProblemDetails
  console.error(response.detail);
}
```

### Key Features

✅ **RFC9457 Compliant** - Follows the official specification
✅ **Type Safe** - Full TypeScript support with `ApiResponse<T>` wrapper
✅ **Frontend Type Guards** - Easy error checking with `isApiSuccess()` and `isApiError()`
✅ **Extensible** - Add custom fields easily
✅ **Backward Compatible** - Existing code continues to work
✅ **Well Tested** - Comprehensive test coverage
✅ **Documented** - Clear guides and examples

### File Structure

```
backend-api/
├── @frouvel/kaname/
│   ├── error/
│   │   ├── FrourioFrameworkError.ts    # Base error class
│   │   ├── CommonErrors.ts              # Pre-built error classes
│   │   └── index.ts                     # Barrel export
│   ├── http/
│   │   ├── ApiResponse.ts               # Main API response facade
│   │   ├── ResponseBuilder.ts           # Fluent validation API
│   │   └── type/
│   │       └── nfc9457.ts               # RFC9457 type definitions
│   └── docs/
│       ├── RFC9457_QUICK_START.md       # Quick reference
│       ├── RFC9457_ERROR_HANDLING.md    # Complete guide
│       └── RFC9457_MIGRATION.md         # Migration guide
├── api/
│   └── example-rfc9457/                 # Example implementation
└── commonTypesWithClient/
    └── ProblemDetails.types.ts          # Shared with frontend
```

### ApiResponse Facade Methods

```typescript
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';

// Success response
ApiResponse.success(data)

// Method-specific error handlers (auto-detect status from error type)
ApiResponse.method.get(error)      // Default: 404
ApiResponse.method.post(error)     // Default: 500
ApiResponse.method.put(error)      // Default: 500
ApiResponse.method.patch(error)    // Default: 403
ApiResponse.method.delete(error)   // Default: 500

// Specific status code methods
ApiResponse.badRequest(detail, extensions?)        // 400
ApiResponse.unauthorized(detail, extensions?)      // 401
ApiResponse.forbidden(detail, extensions?)         // 403
ApiResponse.notFound(detail, extensions?)          // 404
ApiResponse.conflict(detail, extensions?)          // 409
ApiResponse.internalServerError(detail, extensions?) // 500
```

### Available Error Classes

```typescript
import {
  ValidationError,      // 400 - Validation failures
  UnauthorizedError,    // 401 - Authentication failures
  ForbiddenError,       // 403 - Authorization failures
  NotFoundError,        // 404 - Resource not found
  BadRequestError,      // 400 - Malformed requests
  InternalServerError,  // 500 - Unexpected errors
} from '$/@frouvel/kaname/error/CommonErrors';
```

### Getting Started

1. **Read the [Quick Start Guide](./RFC9457_QUICK_START.md)**
2. **Review the [Example Controller](../api/example-rfc9457/controller.ts)**
3. **Start using RFC9457 in your endpoints**

### Migration

If you have existing endpoints, see the [Migration Guide](./RFC9457_MIGRATION.md) for step-by-step instructions.

### Testing

Run tests to verify the implementation:

```bash
npm test rfc9457.test.ts
```

### Standards Compliance

This implementation follows:

- [RFC9457 - Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [RFC3986 - Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986.html)

### Support

- Issues: Check existing code examples
- Questions: See the full documentation
- Updates: Follow the migration guide

---

For more information, start with the [Quick Start Guide](./RFC9457_QUICK_START.md).
