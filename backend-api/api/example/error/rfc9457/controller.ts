/**
 * Example controller demonstrating RFC9457-compliant error handling
 * Using the ApiResponse facade for clean, discoverable API
 * Includes examples with Zod validators and Validator facade
 */

import { defineController } from './$relay';
import {
  ApiResponse,
  ApiResponseBuilder,
} from '$/@frouvel/kaname/http/ApiResponse';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '$/@frouvel/kaname/error/CommonErrors';
import { z } from 'zod';

export default defineController(() => ({
  // Example: Success response using ApiResponse facade
  get: () => ApiResponse.success({ message: 'RFC9457 example endpoint' }),

  // Example: Handling a NotFoundError
  // GET /example-rfc9457/123
  // Response (404):
  // {
  //   "type": "https://example.com/errors/not-found",
  //   "title": "NOT_FOUND",
  //   "status": 404,
  //   "detail": "Resource with ID 123 not found",
  //   "code": "NOT_FOUND",
  //   "timestamp": "2025-11-09T08:59:00.000Z",
  //   "resourceId": "123"
  // }
  post: ({ body }) => {
    try {
      // Simulate resource not found
      if (body.simulateNotFound) {
        throw NotFoundError.create(
          `Resource with ID ${body.resourceId} not found`,
          {
            resourceId: body.resourceId,
          },
        );
      }

      // Simulate validation error
      if (body.simulateValidation) {
        throw ValidationError.create('Invalid input data', {
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'age', message: 'Must be at least 18' },
          ],
        });
      }

      // Simulate unauthorized
      if (body.simulateUnauthorized) {
        throw UnauthorizedError.create('Invalid credentials', {
          reason: 'Token expired',
        });
      }

      return ApiResponse.success({ message: 'Request processed successfully' });
    } catch (error) {
      return ApiResponse.method.post(error);
    }
  },

  // Example: Direct use of return helpers for specific status codes
  put: ({ body }) => {
    // Validation example using Response facade
    if (!body.name) {
      return ApiResponse.badRequest('Name is required', {
        field: 'name',
        received: body.name,
      });
    }

    if (!body.token) {
      return ApiResponse.unauthorized('Authentication token is required', {
        hint: 'Please provide a valid token in the Authorization header',
      });
    }

    return ApiResponse.success({ message: 'Updated successfully' });
  },

  // Example: Handling unknown errors
  delete: () => {
    try {
      // Simulate an unexpected error
      throw new Error('Unexpected database error');
    } catch (error) {
      // ApiResponse.method.delete automatically converts to RFC9457 format
      return ApiResponse.method.delete(error);
    }
  },

  // Example: Using ApiResponseBuilder with .handle() - Clean validation
  // Separates schema validation from business logic
  // Perfect for one-liner controller actions with complex validation
  patch: ({ body }) =>
    ApiResponseBuilder.create()
      .withZodValidation(
        body,
        z.object({
          name: z.string().min(1, '名前は必須です'),
          description: z.string().optional(),
          email: z.string().email('有効なメールアドレスを入力してください'),
          age: z
            .number()
            .int('年齢は整数である必要があります')
            .positive('年齢は正の数である必要があります')
            .max(150, '年齢は150以下である必要があります'),
          siteAreaSquareMeter: z
            .union([
              z.number().positive('敷地面積は正の数である必要があります'),
              z.null(),
            ])
            .optional(),
          minCapacity: z
            .number()
            .int()
            .positive('最小定員は正の整数である必要があります'),
        }),
      )
      .handle((data) => {
        // Business logic validation
        if (data.age < 18) {
          return ApiResponse.forbidden('18歳未満は登録できません', {
            minAge: 18,
            providedAge: data.age,
          });
        }

        // Success response
        return ApiResponse.success({
          message: 'データが正常に更新されました (ApiResponseBuilder)',
          data,
        });
      }),

  // Example: Alternative ApiResponseBuilder syntax with .then() alias
  // .then() is just an alias for .handle() - same functionality
  // Use whichever reads better in your context
  options: ({ body }) =>
    ApiResponseBuilder.create()
      .withZodValidation(
        body,
        z.object({
          name: z.string().min(1, '名前は必須です'),
          description: z.string().optional(),
          email: z.string().email('有効なメールアドレスを入力してください'),
          age: z
            .number()
            .int('年齢は整数である必要があります')
            .positive('年齢は正の数である必要があります')
            .max(150, '年齢は150以下である必要があります'),
          siteAreaSquareMeter: z
            .union([
              z.number().positive('敷地面積は正の数である必要があります'),
              z.null(),
            ])
            .optional(),
          minCapacity: z
            .number()
            .int()
            .positive('最小定員は正の整数である必要があります'),
        }),
      )
      .then((data) => {
        // Business logic validation
        if (data.age < 18) {
          return ApiResponse.forbidden('18歳未満は登録できません', {
            minAge: 18,
            providedAge: data.age,
          });
        }

        // Success response
        return ApiResponse.success({
          message: 'データが正常に更新されました (.then() alias)',
          data,
        });
      }),
}));
