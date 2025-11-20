import { AbstractFrourioFrameworkError } from '$/@frouvel/kaname/error/FrourioFrameworkError';

/**
 * Base URI for RFC 9457 Problem Details type URIs for database errors.
 *
 * This URI uniquely identifies the error type and can optionally point to
 * human-readable documentation. It does not need to be a resolvable URL.
 *
 * In production, you should configure this to use your actual domain:
 * - Example: 'https://yourdomain.com/docs/errors/database'
 * - Or use app config: config('app.url') + '/docs/errors/database'
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */
const DATABASE_ERROR_TYPE_BASE = 'urn:frourio:errors:database';

export class DatabaseNotInitializedError extends AbstractFrourioFrameworkError {
  constructor() {
    super({
      message:
        'Database manager not initialized. Call DB.init(config) first or use the DatabaseServiceProvider.',
      code: 'DATABASE_NOT_INITIALIZED',
      typeUri: `${DATABASE_ERROR_TYPE_BASE}/not-initialized`,
    });
  }
}

export class DatabaseConnectionNotConfiguredError extends AbstractFrourioFrameworkError {
  constructor(connection: string) {
    super({
      message: `Connection '${connection}' is not configured`,
      code: 'DATABASE_CONNECTION_NOT_CONFIGURED',
      details: { connection },
      typeUri: `${DATABASE_ERROR_TYPE_BASE}/connection-not-configured`,
    });
  }
}

export class UnsupportedDatabaseDriverError extends AbstractFrourioFrameworkError {
  constructor(driver: string) {
    super({
      message: `Unsupported database driver: '${driver}'`,
      code: 'DATABASE_UNSUPPORTED_DRIVER',
      details: { driver },
      typeUri: `${DATABASE_ERROR_TYPE_BASE}/unsupported-driver`,
    });
  }
}

export class DatabaseClientUnavailableError extends AbstractFrourioFrameworkError {
  constructor(connection: string, driver: string) {
    super({
      message: `Database client not available for connection '${connection}' using driver '${driver}'`,
      code: 'DATABASE_CLIENT_UNAVAILABLE',
      details: { connection, driver },
      typeUri: `${DATABASE_ERROR_TYPE_BASE}/client-unavailable`,
    });
  }
}

export class DatabaseClientCreationError extends AbstractFrourioFrameworkError {
  constructor(driver: string, cause?: unknown) {
    super({
      message: `Failed to create database client for driver '${driver}'`,
      code: 'DATABASE_CLIENT_CREATION_FAILED',
      details: { driver, cause },
      typeUri: `${DATABASE_ERROR_TYPE_BASE}/client-creation-failed`,
    });
  }
}
