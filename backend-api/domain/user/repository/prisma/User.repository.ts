import type { IUserRepository } from '../User.repository.interface';
import { DB } from '$/@frouvel/kaname/database';
import { LengthAwarePaginator } from '$/@frouvel/kaname/paginator';

/**
 * Prisma User Repository
 *
 * Best practice: Use DB facade instead of injecting PrismaClient
 * - No constructor injection needed
 * - Automatic connection management
 * - Zero overhead (direct pass-through)
 * - Easy to test (can swap connections)
 */
export class UserRepository implements IUserRepository {
  private _prisma = DB.prisma();

  async paginate(args: { page: number; perPage: number; search?: string }) {
    const where = args.search
      ? {
          OR: [
            { name: { contains: args.search } },
            { email: { contains: args.search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this._prisma.user.findMany({
        where,
        take: args.perPage,
        skip: args.perPage * (args.page - 1),
        orderBy: { createdAt: 'desc' },
      }),
      this._prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: LengthAwarePaginator.create({
        data,
        total,
        perPage: args.perPage,
        currentPage: args.page,
      }),
    };
  }

  async findById(args: { id: number }) {
    return this._prisma.user.findUnique({
      where: { id: args.id },
    });
  }

  async create(data: { name: string; email: string; age: number }) {
    return this._prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        age: data.age,
      },
    });
  }

  async update(args: {
    id: number;
    data: {
      name?: string;
      email?: string;
      age?: number;
    };
  }) {
    return this._prisma.user.update({
      where: { id: args.id },
      data: args.data,
    });
  }

  async deleteById(args: { id: number }) {
    await this._prisma.user.delete({
      where: { id: args.id },
    });
  }
}
