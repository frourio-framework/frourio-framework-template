/**
 * Configuration Module
 *
 * Exports configuration helpers and types.
 */

export { config, hasConfig, configAll, configObject } from './config';
export { defineConfig } from './defineConfig';
export type { ConfigType } from './defineConfig';

// Re-export types from user-space configuration
export type {
  Config,
  ConfigPaths,
  AppConfig,
  AdminConfig,
  CorsConfig,
  DatabaseConfig,
  JwtConfig,
  TestingConfig,
} from '$/config/$types';
export type { ConfigPath } from './config';
