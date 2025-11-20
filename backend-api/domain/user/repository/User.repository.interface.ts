import type { LengthAwarePaginator } from '$/@frouvel/kaname/paginator';

export interface IUserRepository {
  paginate(args: {
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
  }>;

  findById(args: { id: number }): Promise<{
    id: number;
    name: string;
    email: string;
    age: number;
    createdAt: Date;
    updatedAt: Date;
  } | null>;

  create(data: { name: string; email: string; age: number }): Promise<{
    id: number;
    name: string;
    email: string;
    age: number;
    createdAt: Date;
    updatedAt: Date;
  }>;

  update(args: {
    id: number;
    data: {
      name?: string;
      email?: string;
      age?: number;
    };
  }): Promise<{
    id: number;
    name: string;
    email: string;
    age: number;
    createdAt: Date;
    updatedAt: Date;
  }>;

  deleteById(args: { id: number }): Promise<void>;
}
