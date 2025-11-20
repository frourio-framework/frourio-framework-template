/**
 * Configuration Helper
 *
 * Laravel-like config() helper function to access configuration values.
 * Supports both dot notation and direct property access with full type inference.
 */

import app from '$/bootstrap/app';
import type { Config, ConfigPaths } from '$/config/$types';

/**
 * Build a dot-notation key union from the Config type for autocomplete and inference.
 */
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;
type PrevDepth = [never, 0, 1, 2, 3, 4];
type NestedPaths<T, Depth extends number = 4> = Depth extends 0
  ? ''
  : T extends readonly any[]
    ? '' // stop at arrays to avoid prototype keys like 'length'
    : T extends object
      ? {
          [K in Extract<keyof T, string>]: `${K}${DotPrefix<NestedPaths<
            T[K],
            PrevDepth[Depth]
          >>}`;
        }[Extract<keyof T, string>]
      : '';

export type ConfigPath = NestedPaths<Config>;

/**
 * Resolve the value type at a given dot-notation path.
 */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Get a configuration value using dot notation with autocomplete
 *
 * @example
 * config('app') // autocomplete: 'app' | 'admin' | 'cors' | 'database' | 'jwt'
 * config('app.name') // type: any (use configObject for full type safety)
 * config('database.pool.max') // type: any
 * config('non.existent.key', 'default') // Returns 'default'
 */
export function config<P extends ConfigPath, D = undefined>(
  key: P,
  defaultValue?: D,
): PathValue<Config, P> | D;
export function config<T = any>(key: ConfigPaths | string, defaultValue?: T): T;
export function config(
  key: ConfigPaths | string,
  defaultValue?: unknown,
): unknown {
  const configs = app.make<Record<string, any>>('config');

  const keys = (key as string).split('.');
  let value: any = configs;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Check if a configuration key exists
 */
export function hasConfig(key: ConfigPaths | string): boolean {
  try {
    const configs = app.make<Record<string, any>>('config');
    const keys = (key as string).split('.');
    let value: any = configs;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get all configuration values for a specific file with autocomplete
 */
export function configAll<K extends keyof Config>(file: K): Config[K];
export function configAll(file: string): Record<string, any> | undefined;
export function configAll(file: string): Record<string, any> | undefined {
  const configs = app.make<Record<string, any>>('config');
  return configs[file];
}

/**
 * Create a deep proxy for configuration access
 */
function createConfigProxy(target: any, path: string[] = []): any {
  return new Proxy(target, {
    get(obj, prop: string) {
      const currentPath = [...path, prop];
      const value = obj[prop];

      // If value is an object, return a proxy to allow chaining
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return createConfigProxy(value, currentPath);
      }

      return value;
    },
  });
}

/**
 * Configuration object with type-safe property access
 *
 * @example
 * configObject.app.name // Returns app name with type inference
 * configObject.app.debug // Returns boolean with type inference
 * configObject.jwt.secret // Returns JWT secret with type inference
 */
export const configObject: Config = new Proxy({} as Config, {
  get(_target, prop: string) {
    const configs = app.make<Record<string, any>>('config');
    const value = configs[prop];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return createConfigProxy(value, [prop]);
    }

    return value;
  },
});
