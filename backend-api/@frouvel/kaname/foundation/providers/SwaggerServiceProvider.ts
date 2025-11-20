/**
 * Swagger Service Provider
 *
 * Framework-level service provider that registers Swagger/OpenAPI documentation.
 * Registers the OpenApiGenerator in the container. The actual Swagger/SwaggerUI
 * plugin registration happens in HttpKernel during Fastify initialization.
 */

import type { Application, ServiceProvider } from '../Application';
import { OpenApiGenerator } from '../../swagger/OpenApiGenerator';
import { config } from '../../config';

export class SwaggerServiceProvider implements ServiceProvider {
  /**
   * Register Swagger services
   */
  register(app: Application): void {
    // Register OpenAPI generator as a singleton
    app.singleton('swagger', () => {
      const swaggerConfig = config('swagger');
      const appConfig = config('app');

      return OpenApiGenerator.create(
        {
          title: swaggerConfig.title || appConfig.name,
          version: swaggerConfig.version,
          description: swaggerConfig.description,
          servers: swaggerConfig.servers,
          basePath: app.basePath(),
          apiBasePath: appConfig.apiBasePath || '',
          tagDescriptions: swaggerConfig.tagDescriptions,
        },
        app.basePath(),
      );
    });

    console.log('[SwaggerServiceProvider] Swagger services registered');
  }

  /**
   * Boot Swagger services
   *
   * Note: Actual Swagger plugin registration happens in HttpKernel
   * during Fastify instance creation.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async boot(_app: Application): Promise<void> {
    // No-op: Swagger plugins are registered in HttpKernel
    console.log(
      '[SwaggerServiceProvider] Swagger configured (registration deferred to HttpKernel)',
    );
  }
}
