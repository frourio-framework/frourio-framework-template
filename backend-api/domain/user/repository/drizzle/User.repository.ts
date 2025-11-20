import type { IUserRepository } from '../User.repository.interface';
import { DB } from '$/@frouvel/kaname/database';
import { users } from '$/database/drizzle/schema';
import { eq, or, like, count, desc } from 'drizzle-orm';
import { LengthAwarePaginator } from '$/@frouvel/kaname/paginator';

/**
 * Drizzle User Repository
 *
 * Uses DB facade for database access (same pattern as Prisma repository).
 * Demonstrates ORM-agnostic repository interface.
 */
export class UserRepositoryDrizzle implements IUserRepository {
  private db = DB.drizzle();

  async paginate(args: {
    page: number;
    perPage: number;
    search?: string;
  }): Promise<{
    data: {
      id: number;
      name: string;
      email: string;
      age: number;
      createdAt: Date;
      updatedAt: Date;
    }[];
    meta: LengthAwarePaginator<{
      id: number;
      name: string;
      email: string;
      age: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }> {
    const where = args.search
      ? or(
          like(users.name, `%${args.search}%`),
          like(users.email, `%${args.search}%`),
        )
      : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(where)
        .limit(args.perPage)
        .offset(args.perPage * (args.page - 1))
        .orderBy(desc(users.createdAt)),
      this.db.select({ total: count() }).from(users).where(where),
    ]);

    return {
      data: data as {
        id: number;
        name: string;
        email: string;
        age: number;
        createdAt: Date;
        updatedAt: Date;
      }[],
      meta: LengthAwarePaginator.create({
        data: data as {
          id: number;
          name: string;
          email: string;
          age: number;
          createdAt: Date;
          updatedAt: Date;
        }[],
        total,
        perPage: args.perPage,
        currentPage: args.page,
      }),
    };
  }

  async findById(args: { id: number }) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, args.id))
      .limit(1);

    return user || null;
  }

  async create(data: { name: string; email: string; age: number }) {
    const now = new Date();
    const [user] = await this.db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        age: data.age,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return user;
  }

  async update(args: {
    id: number;
    data: {
      name?: string;
      email?: string;
      age?: number;
    };
  }) {
    const [user] = await this.db
      .update(users)
      .set({
        ...args.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, args.id))
      .returning();

    return user;
  }

  async deleteById(args: { id: number }) {
    await this.db.delete(users).where(eq(users.id, args.id));
  }
}
