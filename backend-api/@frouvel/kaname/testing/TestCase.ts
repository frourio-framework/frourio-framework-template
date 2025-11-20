import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { TestFunction } from 'vitest';

/**
 * Base TestCase class for all tests
 * Provides common testing functionality and lifecycle hooks
 */
export abstract class TestCase {
  protected server?: FastifyInstance;

  /**
   * Run before all tests in the test suite
   */
  protected async setUpBeforeClass(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Run after all tests in the test suite
   */
  protected async tearDownAfterClass(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Run before each test
   */
  protected async setUp(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Run after each test
   */
  protected async tearDown(): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Register lifecycle hooks with Vitest
   */
  protected registerHooks(): void {
    beforeAll(async () => {
      await this.setUpBeforeClass();
    });

    afterAll(async () => {
      await this.tearDownAfterClass();
    });

    beforeEach(async () => {
      await this.setUp();
    });

    afterEach(async () => {
      await this.tearDown();
    });
  }

  /**
   * Run a test suite
   */
  protected suite(name: string, fn: () => void): void {
    describe(name, () => {
      this.registerHooks();
      fn();
    });
  }

  /**
   * Define a test
   */
  protected test(name: string, fn: TestFunction): void {
    it(name, fn);
  }

  /**
   * Define a test that should be skipped
   */
  protected skip(name: string, fn: TestFunction): void {
    it.skip(name, fn);
  }

  /**
   * Define a test that should be the only one to run
   */
  protected only(name: string, fn: TestFunction): void {
    it.only(name, fn);
  }

  /**
   * Define a test that is expected to fail
   */
  protected fails(name: string, fn: TestFunction): void {
    it.fails(name, fn);
  }

  /**
   * Define a concurrent test
   */
  protected concurrent(name: string, fn: TestFunction): void {
    it.concurrent(name, fn);
  }
}