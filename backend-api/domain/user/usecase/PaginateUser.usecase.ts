import type { IUserRepository } from '../repository/User.repository.interface';

export class PaginateUserUsecase {
  constructor(private readonly _userRepository: IUserRepository) {}

  async execute(args: { page: number; perPage: number; search?: string }) {
    const { data: users, meta } = await this._userRepository.paginate({
      page: args.page,
      perPage: args.perPage,
      search: args.search,
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
      })),
      meta,
    };
  }
}
