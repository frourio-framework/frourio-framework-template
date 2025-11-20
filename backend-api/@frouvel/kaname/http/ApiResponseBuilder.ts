/**
 * Response Builder
 *
 * Builder pattern for creating responses with automatic validation and error handling.
 * Provides a fluent API for controller responses.
 */

import type { z } from 'zod';
import { ApiResponse } from './ApiResponse';
import { Validator } from '../validation/Validator';

/**
 * Helper type to extract only function properties from ApiResponse
 */
type ApiResponseFunctions =
  | typeof ApiResponse.success
  | typeof ApiResponse.error
  | typeof ApiResponse.badRequest
  | typeof ApiResponse.unauthorized
  | typeof ApiResponse.forbidden
  | typeof ApiResponse.notFound
  | typeof ApiResponse.conflict
  | typeof ApiResponse.internalServerError;

/**
 * Response Builder for fluent API
 */
export class ApiResponseBuilder<T = unknown> {
  private validatedData: T | null = null;
  private validationError: ReturnType<typeof ApiResponse.badRequest> | null =
    null;

  private constructor() {}

  /**
   * Create a new ApiResponseBuilder instance
   */
  static create() {
    return new ApiResponseBuilder();
  }

  /**
   * Validate data against a schema
   *
   * @example
   * ```typescript
   * return ApiResponseBuilder.create()
   *   .withZodValidation(body, userSchema)
   *   .handle((data) => {
   *     if (data.age < 18) return ApiResponse.forbidden('未成年は登録できません');
   *     return ApiResponse.success(data);
   *   });
   * ```
   */
  withZodValidation<S extends z.ZodType>(
    data: unknown,
    schema: S,
  ): ApiResponseBuilder<z.infer<S>> {
    const result = Validator.validate(data, schema);

    const builder = new ApiResponseBuilder<z.infer<S>>();

    if (result.isError) {
      builder.validationError = result.response;
    } else {
      builder.validatedData = result.data;
    }

    return builder;
  }

  /**
   * Handle the validated data and return a response
   *
   * If validation failed, this handler will be skipped and validation error will be returned.
   * If validation succeeded, the handler will be called with validated data.
   *
   * @example
   * ```typescript
   * .handle((data) => {
   *   if (data.age < 18) return ApiResponse.forbidden('未成年です');
   *   return ApiResponse.success(data);
   * })
   * ```
   */
  handle<R>(
    handler: (data: T) => R,
  ): R | ReturnType<typeof ApiResponse.badRequest> {
    // If validation failed, return validation error
    if (this.validationError) {
      return this.validationError;
    }

    // If no validated data (this shouldn't happen in normal flow)
    if (this.validatedData === null) {
      return ApiResponse.internalServerError(
        'No validated data available',
      ) as any;
    }

    // Execute handler with validated data
    return handler(this.validatedData);
  }

  /**
   * Alternative name for handle() for better readability
   */
  then<R>(
    handler: (data: T) => R,
  ): R | ReturnType<typeof ApiResponse.badRequest> {
    return this.handle(handler);
  }

  /**
   * Execute with auto-success response
   *
   * Automatically wraps the data in ApiResponse.success()
   * unless business logic validation returns an error response.
   *
   * @example
   * ```typescript
   * .executeWithSuccess((data) => {
   *   if (data.age < 18) return ApiResponse.forbidden('未成年です');
   *   // No need to return ApiResponse.success(), it's automatic
   *   return { message: 'Success', data };
   * })
   * ```
   */
  executeWithSuccess<R>(
    handler: (data: T) => R | ReturnType<ApiResponseFunctions>,
  ): ReturnType<typeof ApiResponse.success> | ReturnType<ApiResponseFunctions> {
    return this.handle((data) => {
      const result = handler(data);

      // If result already has status and body (is a response), return as-is
      if (
        result &&
        typeof result === 'object' &&
        'status' in result &&
        'body' in result
      ) {
        return result as any;
      }

      // Otherwise, wrap in success response
      return ApiResponse.success(result);
    });
  }
}
