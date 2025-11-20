/**
 * Foundation Module
 *
 * Core application framework components inspired by Laravel's Illuminate\Foundation
 */

export { Application } from './Application';
export type { ServiceProvider } from './Application';

export { Kernel } from './Kernel';
export { HttpKernel } from './HttpKernel';
export { ConsoleKernel } from './ConsoleKernel';

export type { Bootstrapper } from './Bootstrapper.interface';

export {
  LoadEnvironmentVariables,
  LoadConfiguration,
  HandleExceptions,
  RegisterProviders,
  BootProviders,
} from './bootstrappers';

export {
  ConsoleServiceProvider,
  DatabaseServiceProvider,
  SwaggerServiceProvider,
} from './providers';

export { getApp, getPrisma } from './helpers';
