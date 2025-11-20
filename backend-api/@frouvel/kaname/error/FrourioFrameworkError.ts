import { DEFAULT_PROBLEM_TYPE } from '$/commonTypesWithClient/ProblemDetails.types';
import type { ProblemDetails } from '.';

export enum ErrorCode {
  // General errors (1000-1999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',

  // User related errors (2000-2999)
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_VERIFIED = 'USER_NOT_VERIFIED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Admin related errors (3000-3999)
  ADMIN_NOT_FOUND = 'ADMIN_NOT_FOUND',
  ADMIN_ALREADY_EXISTS = 'ADMIN_ALREADY_EXISTS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Email related errors (6000-6999)
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',

  // Database related errors (7000-7999)
  DATABASE_NOT_INITIALIZED = 'DATABASE_NOT_INITIALIZED',
  DATABASE_CONNECTION_NOT_CONFIGURED = 'DATABASE_CONNECTION_NOT_CONFIGURED',
  DATABASE_UNSUPPORTED_DRIVER = 'DATABASE_UNSUPPORTED_DRIVER',
  DATABASE_CLIENT_UNAVAILABLE = 'DATABASE_CLIENT_UNAVAILABLE',
  DATABASE_CLIENT_CREATION_FAILED = 'DATABASE_CLIENT_CREATION_FAILED',
}

/**
 * HTTP status codes mapping for error codes
 */
export const ErrorCodeToHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.BAD_REQUEST]: 400,

  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.USER_NOT_VERIFIED]: 401,
  [ErrorCode.WEAK_PASSWORD]: 400,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,

  [ErrorCode.ADMIN_NOT_FOUND]: 404,
  [ErrorCode.ADMIN_ALREADY_EXISTS]: 409,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  [ErrorCode.EMAIL_SEND_FAILED]: 500,
  [ErrorCode.INVALID_EMAIL_FORMAT]: 400,

  [ErrorCode.DATABASE_NOT_INITIALIZED]: 500,
  [ErrorCode.DATABASE_CONNECTION_NOT_CONFIGURED]: 500,
  [ErrorCode.DATABASE_UNSUPPORTED_DRIVER]: 500,
  [ErrorCode.DATABASE_CLIENT_UNAVAILABLE]: 500,
  [ErrorCode.DATABASE_CLIENT_CREATION_FAILED]: 500,
};

/**
 * Base exception class for all Frourio Framework exceptions
 */
export abstract class AbstractFrourioFrameworkError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly instance?: string;
  public readonly typeUri?: string;

  constructor(args: {
    message: string;
    code: keyof typeof ErrorCode;
    details?: Record<string, any>;
    instance?: string;
    typeUri?: string;
  }) {
    super(args.message);
    this.name = this.constructor.name;
    this.code = ErrorCode[args.code];
    this.httpStatusCode = ErrorCodeToHttpStatus[args.code];
    this.details = args.details;
    this.timestamp = new Date();
    this.instance = args.instance;
    this.typeUri = args.typeUri;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace (if available)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert exception to RFC9457 Problem Details format
   * @see https://www.rfc-editor.org/rfc/rfc9457.html
   */
  toProblemDetails(): ProblemDetails {
    const problemDetails: ProblemDetails = {
      type: this.typeUri || DEFAULT_PROBLEM_TYPE,
      title: this.code,
      status: this.httpStatusCode,
      detail: this.message,
    };

    // Add instance if provided
    if (this.instance) {
      problemDetails.instance = this.instance;
    }

    // Add error code as extension member
    problemDetails.code = this.code;

    // Add timestamp as extension member
    problemDetails.timestamp = this.timestamp.toISOString();

    // Add details as extension members if provided
    if (this.details) {
      Object.entries(this.details).forEach(([key, value]) => {
        problemDetails[key] = value;
      });
    }

    return problemDetails;
  }

  /**
   * Convert exception to a plain object
   */
  toObject(): {
    name: string;
    code: ErrorCode;
    message: string;
    httpStatusCode: number;
    details?: Record<string, any>;
    timestamp: Date;
    stack?: string;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      httpStatusCode: this.httpStatusCode,
      ...(this.details && { details: this.details }),
      timestamp: this.timestamp,
      ...(this.stack && { stack: this.stack }),
    };
  }

  /**
   * Check if this exception is of a specific error code
   */
  isErrorCode(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Check if this exception is a client error (4xx status codes)
   */
  isClientError(): boolean {
    return this.httpStatusCode >= 400 && this.httpStatusCode < 500;
  }

  /**
   * Check if this exception is a server error (5xx status codes)
   */
  isServerError(): boolean {
    return this.httpStatusCode >= 500;
  }
}
