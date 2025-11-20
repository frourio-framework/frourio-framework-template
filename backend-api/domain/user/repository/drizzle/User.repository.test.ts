/* eslint-disable max-lines */
import { TestCaseDatabase } from '$/@frouvel/kaname/testing';
import { UserRepositoryDrizzle } from '$/domain/user/repository/drizzle/User.repository';
import { DB } from '$/@frouvel/kaname/database';
import { users } from '$/database/drizzle/schema';
import { getDrizzleClient } from '$/@frouvel/kaname/database';
import { expect } from 'vitest';

class UserRepositoryDrizzleTest extends TestCaseDatabase {
  private repository!: UserRepositoryDrizzle;
  private db!: ReturnType<typeof getDrizzleClient>;

  protected async setUpBeforeClass(): Promise<void> {
    await super.setUpBeforeClass();

    // Initialize Drizzle client and register with DB facade
    this.db = getDrizzleClient();
    DB.register('default', this.db, 'drizzle');
  }

  protected async setUp(): Promise<void> {
    await super.setUp();

    this.repository = new UserRepositoryDrizzle();

    // Clean up users table before each test
    await this.db.delete(users);
  }

  protected async tearDownAfterClass(): Promise<void> {
    await this.db.delete(users);
    await DB.disconnectAll();
    await super.tearDownAfterClass();
  }

  run() {
    this.suite('UserRepositoryDrizzle', () => {
      this.suite('create', () => {
        this.test('should create a new user successfully', async () => {
          const userData = {
            name: 'John Doe',
            email: 'john@example.com',
            age: 25,
          };

          const user = await this.repository.create(userData);

          expect(user).toBeDefined();
          expect(user.id).toBeDefined();
          expect(user.name).toBe(userData.name);
          expect(user.email).toBe(userData.email);
          expect(user.age).toBe(userData.age);
          expect(user.createdAt).toBeInstanceOf(Date);
          expect(user.updatedAt).toBeInstanceOf(Date);
        });

        this.test('should create multiple users with unique ids', async () => {
          const user1 = await this.repository.create({
            name: 'User One',
            email: 'user1@example.com',
            age: 20,
          });

          const user2 = await this.repository.create({
            name: 'User Two',
            email: 'user2@example.com',
            age: 30,
          });

          expect(user1.id).not.toBe(user2.id);
        });
      });

      this.suite('findById', () => {
        this.test('should find an existing user by id', async () => {
          const created = await this.repository.create({
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 28,
          });

          const found = await this.repository.findById({ id: created.id });

          expect(found).toBeDefined();
          expect(found?.id).toBe(created.id);
          expect(found?.name).toBe('Jane Doe');
          expect(found?.email).toBe('jane@example.com');
          expect(found?.age).toBe(28);
        });

        this.test('should return null for non-existent user', async () => {
          const found = await this.repository.findById({ id: 99999 });
          expect(found).toBeNull();
        });
      });

      this.suite('update', () => {
        this.test('should update user name', async () => {
          const created = await this.repository.create({
            name: 'Old Name',
            email: 'user@example.com',
            age: 25,
          });

          const updated = await this.repository.update({
            id: created.id,
            data: { name: 'New Name' },
          });

          expect(updated.id).toBe(created.id);
          expect(updated.name).toBe('New Name');
          expect(updated.email).toBe('user@example.com');
          expect(updated.age).toBe(25);
          expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
            created.updatedAt.getTime(),
          );
        });

        this.test('should update user email', async () => {
          const created = await this.repository.create({
            name: 'User',
            email: 'old@example.com',
            age: 25,
          });

          const updated = await this.repository.update({
            id: created.id,
            data: { email: 'new@example.com' },
          });

          expect(updated.email).toBe('new@example.com');
        });

        this.test('should update user age', async () => {
          const created = await this.repository.create({
            name: 'User',
            email: 'user@example.com',
            age: 25,
          });

          const updated = await this.repository.update({
            id: created.id,
            data: { age: 30 },
          });

          expect(updated.age).toBe(30);
        });

        this.test('should update multiple fields at once', async () => {
          const created = await this.repository.create({
            name: 'Old Name',
            email: 'old@example.com',
            age: 25,
          });

          const updated = await this.repository.update({
            id: created.id,
            data: {
              name: 'New Name',
              email: 'new@example.com',
              age: 30,
            },
          });

          expect(updated.name).toBe('New Name');
          expect(updated.email).toBe('new@example.com');
          expect(updated.age).toBe(30);
        });
      });

      this.suite('deleteById', () => {
        this.test('should delete an existing user', async () => {
          const created = await this.repository.create({
            name: 'To Delete',
            email: 'delete@example.com',
            age: 25,
          });

          await this.repository.deleteById({ id: created.id });

          const found = await this.repository.findById({ id: created.id });
          expect(found).toBeNull();
        });

        this.test(
          'should not throw error when deleting non-existent user',
          async () => {
            await expect(
              this.repository.deleteById({ id: 99999 }),
            ).resolves.toBeUndefined();
          },
        );
      });

      this.suite('paginate', () => {
        this.test('should return paginated results', async () => {
          // Create test users
          await Promise.all([
            this.repository.create({
              name: 'Alice Smith',
              email: 'alice@example.com',
              age: 25,
            }),
            this.repository.create({
              name: 'Bob Johnson',
              email: 'bob@example.com',
              age: 30,
            }),
            this.repository.create({
              name: 'Charlie Brown',
              email: 'charlie@example.com',
              age: 35,
            }),
            this.repository.create({
              name: 'Diana Prince',
              email: 'diana@example.com',
              age: 28,
            }),
            this.repository.create({
              name: 'Eve Wilson',
              email: 'eve@example.com',
              age: 32,
            }),
          ]);

          const result = await this.repository.paginate({
            page: 1,
            perPage: 2,
          });

          expect(result.data).toHaveLength(2);
          expect(result.meta).toBeDefined();
          expect(result.meta.currentPage).toBe(1);
          expect(result.meta.perPage).toBe(2);
          expect(result.meta.total).toBe(5);
          expect(result.meta.lastPage).toBe(3);
        });

        this.test('should return second page correctly', async () => {
          await Promise.all([
            this.repository.create({
              name: 'User 1',
              email: 'user1@example.com',
              age: 20,
            }),
            this.repository.create({
              name: 'User 2',
              email: 'user2@example.com',
              age: 21,
            }),
            this.repository.create({
              name: 'User 3',
              email: 'user3@example.com',
              age: 22,
            }),
            this.repository.create({
              name: 'User 4',
              email: 'user4@example.com',
              age: 23,
            }),
            this.repository.create({
              name: 'User 5',
              email: 'user5@example.com',
              age: 24,
            }),
          ]);

          const result = await this.repository.paginate({
            page: 2,
            perPage: 2,
          });

          expect(result.data).toHaveLength(2);
          expect(result.meta.currentPage).toBe(2);
          expect(result.meta.from).toBe(3);
          expect(result.meta.to).toBe(4);
        });

        this.test('should search by name', async () => {
          await Promise.all([
            this.repository.create({
              name: 'Alice Smith',
              email: 'alice@example.com',
              age: 25,
            }),
            this.repository.create({
              name: 'Bob Johnson',
              email: 'bob@example.com',
              age: 30,
            }),
          ]);

          const result = await this.repository.paginate({
            page: 1,
            perPage: 10,
            search: 'Alice',
          });

          expect(result.data).toHaveLength(1);
          expect(result.data[0].name).toBe('Alice Smith');
          expect(result.meta.total).toBe(1);
        });

        this.test('should search by email', async () => {
          await Promise.all([
            this.repository.create({
              name: 'Alice',
              email: 'alice@example.com',
              age: 25,
            }),
            this.repository.create({
              name: 'Bob',
              email: 'bob@test.com',
              age: 30,
            }),
          ]);

          const result = await this.repository.paginate({
            page: 1,
            perPage: 10,
            search: 'bob@',
          });

          expect(result.data).toHaveLength(1);
          expect(result.data[0].email).toBe('bob@test.com');
        });

        this.test('should return empty results for no matches', async () => {
          await this.repository.create({
            name: 'User',
            email: 'user@example.com',
            age: 25,
          });

          const result = await this.repository.paginate({
            page: 1,
            perPage: 10,
            search: 'nonexistent',
          });

          expect(result.data).toHaveLength(0);
          expect(result.meta.total).toBe(0);
        });

        this.test('should order results by createdAt desc', async () => {
          await this.repository.create({
            name: 'First',
            email: 'first@example.com',
            age: 25,
          });
          await this.repository.create({
            name: 'Second',
            email: 'second@example.com',
            age: 26,
          });
          await this.repository.create({
            name: 'Third',
            email: 'third@example.com',
            age: 27,
          });

          const result = await this.repository.paginate({
            page: 1,
            perPage: 5,
          });

          // Verify results are ordered by createdAt descending
          for (let i = 0; i < result.data.length - 1; i++) {
            expect(result.data[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              result.data[i + 1].createdAt.getTime(),
            );
          }
        });

        this.test(
          'should return correct pagination metadata for empty result',
          async () => {
            const result = await this.repository.paginate({
              page: 1,
              perPage: 10,
            });

            expect(result.data).toHaveLength(0);
            expect(result.meta.total).toBe(0);
            expect(result.meta.currentPage).toBe(1);
            expect(result.meta.lastPage).toBe(0); // 0 pages when no results (Math.ceil(0/10) = 0)
            expect(result.meta.from).toBeNull();
            expect(result.meta.to).toBeNull();
          },
        );
      });

      this.suite('data integrity', () => {
        this.test('should maintain data types correctly', async () => {
          const created = await this.repository.create({
            name: 'Type Test',
            email: 'type@example.com',
            age: 25,
          });

          const found = await this.repository.findById({ id: created.id });

          expect(typeof found?.id).toBe('number');
          expect(typeof found?.name).toBe('string');
          expect(typeof found?.email).toBe('string');
          expect(typeof found?.age).toBe('number');
          expect(found?.createdAt).toBeInstanceOf(Date);
          expect(found?.updatedAt).toBeInstanceOf(Date);
        });

        this.test('should handle paginate return types correctly', async () => {
          await this.repository.create({
            name: 'Pagination Test',
            email: 'pagination@example.com',
            age: 25,
          });

          const result = await this.repository.paginate({
            page: 1,
            perPage: 10,
          });

          // Verify data structure
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.meta).toBeDefined();
          expect(typeof result.meta.total).toBe('number');
          expect(typeof result.meta.perPage).toBe('number');
          expect(typeof result.meta.currentPage).toBe('number');
          expect(typeof result.meta.lastPage).toBe('number');

          // Verify each item has correct types
          result.data.forEach((user) => {
            expect(typeof user.id).toBe('number');
            expect(typeof user.name).toBe('string');
            expect(typeof user.email).toBe('string');
            expect(typeof user.age).toBe('number');
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
          });
        });
      });
    });
  }
}

new UserRepositoryDrizzleTest().run();
