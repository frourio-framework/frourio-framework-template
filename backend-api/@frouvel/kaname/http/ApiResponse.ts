/* eslint-disable max-lines */
/**
 * Response Module
 *
 * Provides a unified, RFC9457-compliant API for creating HTTP responses.
 * All response helpers and the Response facade are defined here.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 */

import type {
  ProblemDetails,
  CreateProblemDetailsOptions,
} from './type/nfc9457';
import { DEFAULT_PROBLEM_TYPE } from './type/nfc9457';
import { AbstractFrourioFrameworkError } from '../error/FrourioFrameworkError';

// Align with Frourio's generated HttpStatusNoOk union in $server.ts
type HttpStatusNoOk =
  | 301
  | 302
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 409
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505;

// ============================================================================
// Core Response Helpers
// ============================================================================

/**
 * Create a Problem Details object
 */
export function createProblemDetails(
  options: CreateProblemDetailsOptions,
): ProblemDetails {
  const problemDetails: ProblemDetails = {
    type: options.type || DEFAULT_PROBLEM_TYPE,
    title: options.title,
    status: options.status,
    detail: options.detail,
  };

  if (options.instance) {
    problemDetails.instance = options.instance;
  }

  if (options.extensions) {
    Object.entries(options.extensions).forEach(([key, value]) => {
      problemDetails[key] = value;
    });
  }

  return problemDetails;
}

/**
 * Convert error to RFC9457 Problem Details
 * @internal
 */
function errorToProblemDetails(error: unknown): ProblemDetails {
  // If it's already a FrourioFrameworkError, use its toProblemDetails method
  if (error instanceof AbstractFrourioFrameworkError) {
    return error.toProblemDetails();
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return createProblemDetails({
      status: 500,
      title: 'Internal Server Error',
      detail: error.message || 'An unexpected error occurred',
      extensions: {
        errorName: error.name,
      },
    });
  }

  // Handle unknown errors
  return createProblemDetails({
    status: 500,
    title: 'Internal Server Error',
    detail: 'An unexpected error occurred',
    extensions: {
      error: String(error),
    },
  });
}

/**
 * Return success response
 * @internal
 */
const returnSuccess = <T>(val: T) => ({
  status: 200 as const,
  body: val,
});

/**
 * Return RFC9457-compliant error response
 * @internal
 */
function returnProblemDetails(
  error: unknown,
  defaultStatus: HttpStatusNoOk = 500,
) {
  const problemDetails = errorToProblemDetails(error);
  const status =
    (problemDetails.status as HttpStatusNoOk | undefined) ?? defaultStatus;

  return {
    status,
    body: problemDetails,
  };
}

/**
 * Return error for GET requests (404 Not Found)
 * @internal
 */
const returnGetError = (error: unknown) => {
  return returnProblemDetails(error, 404);
};

/**
 * Return error for POST requests (500 Internal Server Error)
 * @internal
 */
const returnPostError = (error: unknown) => {
  return returnProblemDetails(error, 500);
};

/**
 * Return error for PUT requests (500 Internal Server Error)
 * @internal
 */
const returnPutError = (error: unknown) => {
  return returnProblemDetails(error, 500);
};

/**
 * Return error for PATCH requests (403 Forbidden)
 * @internal
 */
const returnPatchError = (error: unknown) => {
  return returnProblemDetails(error, 403);
};

/**
 * Return error for DELETE requests (500 Internal Server Error)
 * @internal
 */
const returnDeleteError = (error: unknown) => {
  return returnProblemDetails(error, 500);
};

/**
 * Return 400 Bad Request error
 * @internal
 */
function returnBadRequest(detail: string, extensions?: Record<string, any>) {
  const problemDetails = createProblemDetails({
    status: 400,
    title: 'Bad Request',
    detail,
    extensions,
  });

  return {
    status: 400 as const,
    body: problemDetails,
  } as const;
}

/**
 * Return 401 Unauthorized error
 * @internal
 */
function returnUnauthorized(detail: string, extensions?: Record<string, any>) {
  const problemDetails = createProblemDetails({
    status: 401,
    title: 'Unauthorized',
    detail,
    extensions,
  });

  return {
    status: 401 as const,
    body: problemDetails,
  } as const;
}

/**
 * Return 403 Forbidden error
 * @internal
 */
function returnForbidden(detail: string, extensions?: Record<string, any>) {
  const problemDetails = createProblemDetails({
    status: 403,
    title: 'Forbidden',
    detail,
    extensions,
  });

  return {
    status: 403 as const,
    body: problemDetails,
  } as const;
}

/**
 * Return 404 Not Found error
 * @internal
 */
function returnNotFound(detail: string, extensions?: Record<string, any>) {
  const problemDetails = createProblemDetails({
    status: 404,
    title: 'Not Found',
    detail,
    extensions,
  });

  return {
    status: 404 as const,
    body: problemDetails,
  } as const;
}

/**
 * Return 409 Conflict error
 * @internal
 */
function returnConflict(detail: string, extensions?: Record<string, any>) {
  const problemDetails = createProblemDetails({
    status: 409,
    title: 'Conflict',
    detail,
    extensions,
  });

  return {
    status: 409 as const,
    body: problemDetails,
  } as const;
}

/**
 * Return 500 Internal Server Error
 * @internal
 */
function returnInternalServerError(
  detail: string,
  extensions?: Record<string, any>,
) {
  const problemDetails = createProblemDetails({
    status: 500,
    title: 'Internal Server Error',
    detail,
    extensions,
  });

  return {
    status: 500 as const,
    body: problemDetails,
  } as const;
}

// ============================================================================
// Response Facade
// ============================================================================

/**
 * Response Facade (Public API)
 *
 * The unified, public API for creating HTTP responses.
 * This is the ONLY export that should be used by client code.
 *
 * Following the Open/Closed Principle:
 * - Closed for modification: Internal helpers are not exported
 * - Open for extension: All functionality is available through this facade
 *
 * @example
 * ```typescript
 * import { Response } from '$/app/http/Response';
 *
 * export default defineController(() => ({
 *   get: ({ params }) => {
 *     const user = findUser(params.id);
 *     if (!user) {
 *       return Response.notFound(`User ${params.id} not found`, { userId: params.id });
 *     }
 *     return Response.success(user);
 *   },
 * }));
 * ```
 */
export const ApiResponse = {
  /**
   * Return a successful response (200 OK)
   *
   * @example ApiResponse.success({ id: 1, name: 'John' })
   */
  success: returnSuccess,

  /**
   * Return an error response with automatic status detection
   *
   * @example Response.error(error, 404)
   */
  error: returnProblemDetails,

  /**
   * 400 Bad Request
   *
   * @example Response.badRequest('Missing required field', { field: 'email' })
   */
  badRequest: returnBadRequest,

  /**
   * 401 Unauthorized
   *
   * @example Response.unauthorized('Invalid token')
   */
  unauthorized: returnUnauthorized,

  /**
   * 403 Forbidden
   *
   * @example Response.forbidden('Insufficient permissions')
   */
  forbidden: returnForbidden,

  /**
   * 404 Not Found
   *
   * @example Response.notFound('User not found', { userId: '123' })
   */
  notFound: returnNotFound,

  /**
   * 409 Conflict
   *
   * @example Response.conflict('User already exists')
   */
  conflict: returnConflict,

  /**
   * 500 Internal Server Error
   *
   * @example Response.internalServerError('Database connection failed')
   */
  internalServerError: returnInternalServerError,

  /**
   * HTTP Method-Specific Error Handlers
   */
  method: {
    /** Handle GET request errors (default: 404 Not Found) */
    get: returnGetError,
    /** Handle POST request errors (default: 500 Internal Server Error) */
    post: returnPostError,
    /** Handle PUT request errors (default: 500 Internal Server Error) */
    put: returnPutError,
    /** Handle PATCH request errors (default: 403 Forbidden) */
    patch: returnPatchError,
    /** Handle DELETE request errors (default: 500 Internal Server Error) */
    delete: returnDeleteError,
  },

  /**
   * Utility Functions
   */
  utils: {
    /** Create a Problem Details object */
    createProblemDetails,
    /** Convert an error to Problem Details format */
    errorToProblemDetails,
  },
} as const;

// Export ApiResponseBuilder
export { ApiResponseBuilder } from './ApiResponseBuilder';
// Keep ResponseBuilder as deprecated alias for backward compatibility
export { ApiResponseBuilder as ResponseBuilder } from './ApiResponseBuilder';

// Export types
export type {
  ProblemDetails,
  CreateProblemDetailsOptions,
} from './type/nfc9457';
export {
  PROBLEM_DETAILS_MEDIA_TYPE,
  DEFAULT_PROBLEM_TYPE,
} from './type/nfc9457';
