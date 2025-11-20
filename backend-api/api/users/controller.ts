/**
 * Users Controller
 *
 * Demonstrates proper dependency injection with Application container
 */

import { defineController } from './$relay';
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';
import { DB } from '$/@frouvel/kaname/database';
import app from '$/bootstrap/app';
import type { PaginateUserUsecase } from '$/domain/user/usecase/PaginateUser.usecase';

export default defineController(() => ({
  /**
   * GET /users
   * Uses PaginateUserUsecase resolved from the Application container
   */
  get: ({ query }) => {
    const paginateUserUsecase = app.make<PaginateUserUsecase>(
      'PaginateUserUsecase',
    );

    return paginateUserUsecase
      .execute({
        page: query.page,
        perPage: query.limit,
        search: query.search,
      })
      .then((result) =>
        ApiResponse.success({
          data: result.users,
          meta: result.meta.toResponse().meta,
        }),
      )
      .catch(ApiResponse.method.get);
  },

  /**
   * POST /users
   * Example: Direct Prisma usage with validation
   */
  post: ({ body }) => {
    const prisma = DB.prisma();

    return prisma.user
      .create({
        data: {
          name: body.name,
          email: body.email,
          age: body.age,
        },
      })
      .then((user) =>
        ApiResponse.success({
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          createdAt: user.createdAt.toISOString(),
        }),
      )
      .catch(ApiResponse.method.post);
  },
}));
