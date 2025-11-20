/**
 * ApiResponseBuilder Tests
 *
 * Tests for the ApiResponseBuilder class
 */

import { describe, it, expect } from 'vitest';
import { ApiResponseBuilder } from '$/@frouvel/kaname/http/ApiResponseBuilder';
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';
import { z } from 'zod';

describe('ApiResponseBuilder', () => {
  describe('withZodValidation', () => {
    it('should successfully validate data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const validData = { name: 'John', age: 30 };

      const result = ApiResponseBuilder.create()
        .withZodValidation(validData, schema)
        .handle((data) => {
          expect(data).toEqual(validData);
          return ApiResponse.success(data);
        });

      expect(result.status).toBe(200);
      expect(result.body).toEqual(validData);
    });

    it('should return validation error for invalid data', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const invalidData = { name: 'John', age: 'not-a-number' };

      const result = ApiResponseBuilder.create()
        .withZodValidation(invalidData, schema)
        .handle((data) => ApiResponse.success(data));

      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty('title', 'Bad Request');
      expect(result.body).toHaveProperty('errors');
    });

    it('should validate with Japanese error messages', () => {
      const schema = z.object({
        email: z.string().email('有効なメールアドレスを入力してください'),
        age: z
          .number()
          .positive('年齢は正の数である必要があります')
          .max(150, '年齢は150以下である必要があります'),
      });

      const invalidData = { email: 'invalid-email', age: -5 };

      const result = ApiResponseBuilder.create()
        .withZodValidation(invalidData, schema)
        .handle((data) => ApiResponse.success(data));

      expect(result.status).toBe(400);
      const errors = (result.body as any).errors;
      expect(errors).toBeDefined();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toHaveProperty('message');
    });
  });

  describe('handle', () => {
    it('should execute handler with validated data', () => {
      const schema = z.object({ name: z.string() });
      const data = { name: 'Test' };

      const result = ApiResponseBuilder.create()
        .withZodValidation(data, schema)
        .handle((validData) => {
          return ApiResponse.success({ processed: validData.name });
        });

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ processed: 'Test' });
    });

    it('should allow business logic validation in handler', () => {
      const schema = z.object({ age: z.number() });
      const data = { age: 15 };

      const result = ApiResponseBuilder.create()
        .withZodValidation(data, schema)
        .handle((validData) => {
          if (validData.age < 18) {
            return ApiResponse.forbidden('18歳未満は登録できません', {
              minAge: 18,
              providedAge: validData.age,
            });
          }
          return ApiResponse.success(validData);
        });

      expect(result.status).toBe(403);
      expect(result.body).toHaveProperty('title', 'Forbidden');
      expect((result.body as any).minAge).toBe(18);
      expect((result.body as any).providedAge).toBe(15);
    });

    it('should not execute handler if validation fails', () => {
      const schema = z.object({ name: z.string() });
      const invalidData = { name: 123 }; // number instead of string

      let handlerCalled = false;

      const result = ApiResponseBuilder.create()
        .withZodValidation(invalidData, schema)
        .handle(() => {
          handlerCalled = true;
          return ApiResponse.success({});
        });

      expect(handlerCalled).toBe(false);
      expect(result.status).toBe(400);
    });
  });

  describe('then (alias for handle)', () => {
    it('should work exactly like handle', () => {
      const schema = z.object({ value: z.number() });
      const data = { value: 42 };

      const result = ApiResponseBuilder.create()
        .withZodValidation(data, schema)
        .then((validData) => ApiResponse.success(validData));

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ value: 42 });
    });
  });

  describe('executeWithSuccess', () => {
    it('should auto-wrap non-response return values in success', () => {
      const schema = z.object({ name: z.string() });
      const data = { name: 'Auto' };

      const result = ApiResponseBuilder.create()
        .withZodValidation(data, schema)
        .executeWithSuccess((validData) => {
          return { processed: validData.name };
        });

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ processed: 'Auto' });
    });

    it('should not wrap error responses', () => {
      const schema = z.object({ age: z.number() });
      const data = { age: 15 };

      const result = ApiResponseBuilder.create()
        .withZodValidation(data, schema)
        .executeWithSuccess((validData) => {
          if (validData.age < 18) {
            return ApiResponse.forbidden('18歳未満です');
          }
          return { age: validData.age };
        });

      expect(result.status).toBe(403);
      expect(result.body).toHaveProperty('title', 'Forbidden');
    });

    it('should pass through ApiResponse objects unchanged', () => {
      const schema = z.object({ id: z.number() });
      const data = { id: 1 };

      const result = ApiResponseBuilder.create()
        .withZodValidation(data, schema)
        .executeWithSuccess((validData) => {
          return ApiResponse.success({
            message: 'Custom success',
            id: validData.id,
          });
        });

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ message: 'Custom success', id: 1 });
    });
  });

  describe('complex scenarios', () => {
    it('should handle complex nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            age: z.number(),
            email: z.string().email(),
          }),
        }),
        metadata: z.object({
          createdAt: z.string(),
        }),
      });

      const validData = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            email: 'john@example.com',
          },
        },
        metadata: {
          createdAt: '2025-11-10',
        },
      };

      const result = ApiResponseBuilder.create()
        .withZodValidation(validData, schema)
        .handle((data) => {
          expect(data.user.profile.age).toBe(30);
          return ApiResponse.success(data);
        });

      expect(result.status).toBe(200);
    });

    it('should handle optional fields correctly', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.number().nullable(),
      });

      const data = {
        required: 'test',
        nullable: null,
      };

      const result = ApiResponseBuilder.create()
        .withZodValidation(data, schema)
        .handle((validData) => {
          expect(validData.required).toBe('test');
          expect(validData.optional).toBeUndefined();
          expect(validData.nullable).toBeNull();
          return ApiResponse.success(validData);
        });

      expect(result.status).toBe(200);
    });
  });

  describe('type safety', () => {
    it('should preserve types through the chain', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        active: z.boolean(),
      });

      ApiResponseBuilder.create()
        .withZodValidation({ name: 'Test', age: 30, active: true }, schema)
        .handle((data) => {
          // TypeScript should infer these types correctly
          const name: string = data.name;
          const age: number = data.age;
          const active: boolean = data.active;

          expect(typeof name).toBe('string');
          expect(typeof age).toBe('number');
          expect(typeof active).toBe('boolean');

          return ApiResponse.success(data);
        });
    });
  });
});
