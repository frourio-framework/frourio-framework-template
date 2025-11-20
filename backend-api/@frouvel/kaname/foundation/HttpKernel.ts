/**
 * HTTP Kernel
 *
 * Handles HTTP requests and manages the application lifecycle for web requests.
 * Bootstraps the application and initializes the Fastify server.
 */

import type { FastifyInstance, FastifyServerFactory } from 'fastify';
import Fastify from 'fastify';
import server from '$/$server';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { Kernel } from './Kernel';
import type { Bootstrapper } from './Bootstrapper.interface';
import {
  LoadEnvironmentVariables,
  LoadConfiguration,
  HandleExceptions,
  RegisterProviders,
  BootProviders,
} from './bootstrappers';
import { AbstractFrourioFrameworkError } from '../error/FrourioFrameworkError';
import { PROBLEM_DETAILS_MEDIA_TYPE } from '../http/ApiResponse';
import type { OpenApiGenerator } from '../swagger/OpenApiGenerator';
import { config } from '../config';

export class HttpKernel extends Kernel {
  private _fastifyInstance: FastifyInstance | null = null;

  /**
   * Get the Fastify instance
   * Used by service providers that need to register routes/plugins
   */
  getFastify(): FastifyInstance {
    if (!this._fastifyInstance) {
      throw new Error('Fastify instance not initialized. Call handle() first.');
    }
    return this._fastifyInstance;
  }

  /**
   * Get the bootstrappers for HTTP requests
   */
  protected getBootstrappers(): Array<new () => Bootstrapper> {
    return [
      LoadEnvironmentVariables,
      LoadConfiguration,
      HandleExceptions,
      RegisterProviders,
      BootProviders,
    ];
  }

  /**
   * Initialize and return the Fastify instance
   */
  async handle(serverFactory?: FastifyServerFactory): Promise<FastifyInstance> {
    // Bootstrap the application
    await this.bootstrap();

    // Create Fastify instance if not already created
    if (!this._fastifyInstance) {
      this._fastifyInstance = await this.createFastifyInstance(serverFactory);
      this._app.setFastifyInstance(this._fastifyInstance);
    }

    return this._fastifyInstance;
  }

  /**
   * Create and configure the Fastify instance
   */
  private async createFastifyInstance(
    serverFactory?: FastifyServerFactory,
  ): Promise<FastifyInstance> {
    const env = this._app.environment();

    console.log(`[HttpKernel] Creating Fastify instance in ${env} mode`);

    const app = Fastify({
      routerOptions: {
        maxParamLength: 1000,
      },
      ...serverFactory,
      logger:
        env === 'production'
          ? true
          : {
              level: 'info',
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              },
            },
    });

    // Register plugins
    await this.registerPlugins(app);

    // Set up error handler
    this.setupErrorHandler(app);

    // Attach Application instance to Fastify for DI access
    app.decorate('app', this._app);

    // Register routes via Frourio
    const appConfig = config('app');
    server(app, { basePath: appConfig.apiBasePath });

    console.log('[HttpKernel] Fastify instance configured');
    console.log('[HttpKernel] Application instance attached to Fastify');

    return app;
  }

  /**
   * Register Fastify plugins
   */
  private async registerPlugins(app: FastifyInstance): Promise<void> {
    // Security headers
    await app.register(helmet);

    // CORS configuration
    try {
      const corsConfig = config('cors');
      await app.register(cors, {
        origin: corsConfig?.origins || '*',
        credentials: corsConfig?.credentials ?? true,
        methods: corsConfig?.methods || [
          'GET',
          'HEAD',
          'PUT',
          'POST',
          'DELETE',
          'PATCH',
          'OPTIONS',
        ],
        allowedHeaders: corsConfig?.allowedHeaders || [
          'Content-Type',
          'Authorization',
        ],
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.warn('[HttpKernel] CORS config not found, using defaults');
      await app.register(cors, {
        origin: '*',
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
    }

    // Cookie support
    await app.register(cookie);

    // JWT authentication
    await app.register(jwt, {
      secret: config<string>('jwt.secret'),
    });

    // Swagger/OpenAPI documentation
    await this.registerSwagger(app);

    console.log('[HttpKernel] Plugins registered');
  }
  /**
   * Register Swagger/OpenAPI documentation
   */
  private async registerSwagger(app: FastifyInstance): Promise<void> {
    try {
      const swaggerConfig = config('swagger');

      // Skip if config not loaded or disabled
      if (!swaggerConfig || !swaggerConfig.enabled) {
        if (!swaggerConfig) {
          console.log('[HttpKernel] Swagger config not loaded, skipping');
        } else {
          console.log('[HttpKernel] Swagger is disabled');
        }
        return;
      }

      // Get OpenAPI generator from container if available
      if (!this._app.has('swagger')) {
        console.log(
          '[HttpKernel] Swagger generator not available in container',
        );
        return;
      }

      const generator = this._app.make<OpenApiGenerator>('swagger');
      const spec = generator.generate();

      // Register @fastify/swagger plugin with generated spec
      await app.register(fastifySwagger, {
        mode: 'static',
        specification: {
          document: spec,
        },
      });

      // Register @fastify/swagger-ui plugin
      await app.register(fastifySwaggerUI, {
        routePrefix: swaggerConfig.path || '/api-docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: true,
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
      });

      console.log(
        `[HttpKernel] Swagger UI available at ${swaggerConfig.path || '/api-docs'}`,
      );
    } catch (error) {
      console.error('[HttpKernel] Failed to register Swagger:', error);
      // Don't throw - Swagger is optional
    }
  }

  /**
   * Set up global error handler
   */
  private setupErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((error, request, reply) => {
      if (error instanceof AbstractFrourioFrameworkError) {
        console.error({
          error,
          requestId: request.id,
          body: request.body,
          params: request.params,
          query: request.query,
        });

        reply
          .status(error.httpStatusCode)
          .header('Content-Type', PROBLEM_DETAILS_MEDIA_TYPE)
          .send(error.toProblemDetails());
      } else {
        // Let Fastify handle other errors
        reply.send(error);
      }
    });
  }
}
