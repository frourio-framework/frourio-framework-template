# Database Error Reference

This page documents database-layer errors emitted by `@frouvel/kaname/database`. Every error derives from the framework's RFC9457-compatible `AbstractFrourioFrameworkError`, so you can surface them to clients as Problem Details without losing context.

## How to handle

```ts
import { DatabaseNotInitializedError } from '$/@frouvel/kaname/database';

try {
  const prisma = DB.prisma();
  // ...
} catch (error) {
  if (error instanceof DatabaseNotInitializedError) {
    // Recover or bubble up as a Problem Details response
    return error.toProblemDetails();
  }
  throw error;
}
```

Typically you will convert these errors to HTTP responses in a global handler:

```ts
import { AbstractFrourioFrameworkError } from '$/@frouvel/kaname/error';

function toProblem(error: unknown) {
  if (error instanceof AbstractFrourioFrameworkError) {
    return error.toProblemDetails();
  }
  // fallback
  return {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred.',
  };
}
```

## Error catalog

| Error class | Code | HTTP status | When it happens | Typical resolution |
| --- | --- | --- | --- | --- |
| `DatabaseNotInitializedError` | `DATABASE_NOT_INITIALIZED` | 500 | `DB` facade used before initialization (e.g., missing `DatabaseServiceProvider` or `DB.init`). | Ensure `DatabaseServiceProvider` runs early or call `DB.init` in setup. |
| `DatabaseConnectionNotConfiguredError` | `DATABASE_CONNECTION_NOT_CONFIGURED` | 500 | Requested connection name is missing in `config/database`. | Add the connection config or adjust the requested name. |
| `UnsupportedDatabaseDriverError` | `DATABASE_UNSUPPORTED_DRIVER` | 500 | A driver name is not registered in `DatabaseManager`. | Register a custom `DatabaseDriver` via `DB.getManager().registerDriver(name, driver)`. |
| `DatabaseClientUnavailableError` | `DATABASE_CLIENT_UNAVAILABLE` | 500 | Client lookup failed for the given connection/driver. | Verify the connection is configured for that driver and initialized. |
| `DatabaseClientCreationError` | `DATABASE_CLIENT_CREATION_FAILED` | 500 | Client factory threw while creating a Prisma/Drizzle/custom client. | Check connection URL/credentials and driver setup; review the nested `cause` in the error details. |

## Custom drivers

When adding a new ORM/driver, implement `DatabaseDriver` and register it. Be sure to surface driver-specific issues using `DatabaseClientCreationError` (or your own subclass) so they remain RFC-friendly and visible to users.
