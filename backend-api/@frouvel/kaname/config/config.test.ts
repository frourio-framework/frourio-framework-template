/**
 * Configuration Helper Tests
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import app from '$/bootstrap/app';
import { config, hasConfig, configAll } from './config';

const mockConfig = {
  app: {
    name: 'Test App',
    env: 'test',
    debug: true,
    nested: {
      value: 'deep value',
    },
  },
  database: {
    connections: {
      postgresql: {
        url: 'postgresql://test',
      },
    },
  },
  custom: {
    feature: {
      enabled: true,
      limit: 100,
    },
  },
};

describe('Configuration Helper', () => {
  beforeAll(() => {
    // Register mock config in the application container for unit tests
    app.singleton('config', () => mockConfig);
  });

  beforeEach(() => {
    // No-op: placeholder for future per-test setup
  });

  describe('config()', () => {
    it('should get top-level config value', () => {
      const appName = config('app.name');
      expect(appName).toBe('Test App');
    });

    it('should get nested config value', () => {
      const dbUrl = config('database.connections.postgresql.url');
      expect(dbUrl).toBe('postgresql://test');
    });

    it('should get deeply nested value', () => {
      const nestedValue = config('app.nested.value');
      expect(nestedValue).toBe('deep value');
    });

    it('should return default value for non-existent key', () => {
      const value = config('non.existent.key', 'default');
      expect(value).toBe('default');
    });

    it('should return undefined for non-existent key without default', () => {
      const value = config('non.existent.key');
      expect(value).toBeUndefined();
    });

    it('should handle type parameter', () => {
      const debug = config<boolean>('app.debug');
      expect(typeof debug).toBe('boolean');
      expect(debug).toBe(true);
    });

    it('should handle number types', () => {
      const limit = config<number>('custom.feature.limit');
      expect(typeof limit).toBe('number');
      expect(limit).toBe(100);
    });

    it('should handle object types', () => {
      const feature = config<{ enabled: boolean; limit: number }>(
        'custom.feature',
      );
      expect(feature).toEqual({
        enabled: true,
        limit: 100,
      });
    });
  });

  describe('hasConfig()', () => {
    it('should return true for existing config', () => {
      expect(hasConfig('app.name')).toBe(true);
      expect(hasConfig('database.connections.postgresql.url')).toBe(true);
      expect(hasConfig('custom.feature.enabled')).toBe(true);
    });

    it('should return false for non-existing config', () => {
      expect(hasConfig('non.existent')).toBe(false);
      expect(hasConfig('app.non.existent')).toBe(false);
    });
  });

  describe('configAll()', () => {
    it('should get all config for a file', () => {
      const appConfig = configAll('app');
      expect(appConfig).toEqual({
        name: 'Test App',
        env: 'test',
        debug: true,
        nested: {
          value: 'deep value',
        },
      });
    });

    it('should get all config for database file', () => {
      const dbConfig = configAll('database');
      expect(dbConfig).toEqual({
        connections: {
          postgresql: {
            url: 'postgresql://test',
          },
        },
      });
    });

    it('should get all config for custom file', () => {
      const customConfig = configAll('custom');
      expect(customConfig).toEqual({
        feature: {
          enabled: true,
          limit: 100,
        },
      });
    });

    it('should return undefined for non-existent file', () => {
      const config = configAll('nonexistent' as any);
      expect(config).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string config key', () => {
      const value = config('', 'default');
      expect(value).toBe('default');
    });

    it('should handle config key with trailing dots', () => {
      const value = config('app.name.', 'default');
      expect(value).toBe('default');
    });

    it('should handle config key with leading dots', () => {
      const value = config('.app.name', 'default');
      expect(value).toBe('default');
    });

    it('should handle null as default value', () => {
      const value = config('non.existent', null);
      expect(value).toBeNull();
    });

    it('should handle boolean false as default value', () => {
      const value = config('non.existent', false);
      expect(value).toBe(false);
    });

    it('should handle zero as default value', () => {
      const value = config('non.existent', 0);
      expect(value).toBe(0);
    });
  });
});
