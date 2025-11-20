/**
 * Application Service Provider
 *
 * Register application-specific services and commands here.
 * This is where you register your custom console commands.
 */

import type {
  Application,
  ServiceProvider,
} from '$/@frouvel/kaname/foundation';
import type { ConsoleKernel } from '$/@frouvel/kaname/foundation';

// Import your custom commands here
import { ExampleCommand } from '$/app/console/ExampleCommand';
import { GenerateOpenApiCommand } from '$/app/console/GenerateOpenApiCommand';

// Import repositories
import type { IUserRepository } from '$/domain/user/repository/User.repository.interface';
import { UserRepository } from '$/domain/user/repository/prisma/User.repository';

// Import use cases
import { PaginateUserUsecase } from '$/domain/user/usecase/PaginateUser.usecase';

export class AppServiceProvider implements ServiceProvider {
  register(app: Application): void {
    // Bind IUserRepository to Prisma implementation
    app.bind<IUserRepository>('IUserRepository', () => new UserRepository());

    // Bind UseCases with dependency injection
    app.bind<PaginateUserUsecase>('PaginateUserUsecase', () => {
      const userRepository = app.make<IUserRepository>('IUserRepository');
      return new PaginateUserUsecase(userRepository);
    });

    console.log('[AppServiceProvider] Application services registered');
  }

  async boot(app: Application): Promise<void> {
    // Register custom console commands
    const kernel = app.make<ConsoleKernel>('ConsoleKernel');

    // Register your commands here:
    kernel.registerCommands([
      new ExampleCommand(app),
      new GenerateOpenApiCommand(app),
      // Add more commands here as needed
    ]);

    console.log('[AppServiceProvider] Application services booted');
  }
}
