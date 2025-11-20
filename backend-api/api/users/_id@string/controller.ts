/**
 * User Detail Controller Example
 *
 * Demonstrates single resource operations with DB facade
 */

import { defineController } from './$relay';
import { ApiResponse } from '$/@frouvel/kaname/http/ApiResponse';
import { DB } from '$/@frouvel/kaname/database';

export default defineController(() => ({
  /**
   * GET /users/:id
   * Example: Finding a single resource
   */
  get: ({ params }) => {
    const prisma = DB.prisma();
    const userId = parseInt(params.id, 10);

    return prisma.user
      .findUnique({ where: { id: userId } })
      .then((user) => {
        if (!user) {
          return ApiResponse.notFound('User not found', { userId });
        }

        return ApiResponse.success({
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        });
      })
      .catch(ApiResponse.method.get);
  },

  /**
   * PATCH /users/:id
   * Example: Updating a resource
   */
  patch: ({ params, body }) => {
    const prisma = DB.prisma();
    const userId = parseInt(params.id, 10);

    return prisma.user
      .update({
        where: { id: userId },
        data: body,
      })
      .then((user) =>
        ApiResponse.success({
          id: user.id,
          name: user.name,
          email: user.email,
          age: user.age,
          updatedAt: user.updatedAt.toISOString(),
        }),
      )
      .catch(ApiResponse.method.patch);
  },

  /**
   * DELETE /users/:id
   * Example: Deleting a resource
   */
  delete: ({ params }) => {
    const prisma = DB.prisma();
    const userId = parseInt(params.id, 10);

    return prisma.user
      .delete({ where: { id: userId } })
      .then(() => ApiResponse.success({ success: true as const }))
      .catch(ApiResponse.method.delete);
  },
}));
