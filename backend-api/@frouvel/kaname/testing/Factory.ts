import type { PrismaClient } from '@prisma/client';

/**
 * Factory function type for creating test data
 */
export type FactoryFunction<T> = (overrides?: Partial<T>) => T;

/**
 * Factory builder function type
 */
export type FactoryBuilder<T> = (
  count?: number,
  overrides?: Partial<T>,
) => T | T[];

/**
 * Base Factory class for creating test data
 * Provides a fluent interface for building test data
 */
export abstract class Factory<T> {
  protected prisma?: PrismaClient;
  protected count = 1;
  protected states: Map<string, Partial<T>> = new Map();
  protected currentState?: string;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Define the default attributes for the factory
   */
  protected abstract definition(): T;

  /**
   * Create a specific state for the factory
   */
  protected state(name: string, attributes: Partial<T>): this {
    this.states.set(name, attributes);
    return this;
  }

  /**
   * Apply a state to the factory
   */
  public as(state: string): this {
    this.currentState = state;
    return this;
  }

  /**
   * Set the number of models to create
   */
  public times(count: number): this {
    this.count = count;
    return this;
  }

  /**
   * Create model(s) with the given attributes
   */
  public make(overrides?: Partial<T>): T | T[] {
    const items: T[] = [];

    for (let i = 0; i < this.count; i++) {
      const definition = this.definition();
      const stateAttributes = this.currentState
        ? this.states.get(this.currentState) || {}
        : {};

      const merged = {
        ...definition,
        ...stateAttributes,
        ...(overrides || {}),
      } as T;

      items.push(merged);
    }

    // Reset state
    this.count = 1;
    this.currentState = undefined;

    return items.length === 1 ? items[0] : items;
  }

  /**
   * Create and persist model(s) with the given attributes
   * Subclasses should override this to implement persistence logic
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async create(overrides?: Partial<T>): Promise<T | T[]> {
    throw new Error(
      'create() must be implemented in subclass with Prisma persistence',
    );
  }

  /**
   * Create a raw object without persisting
   */
  public raw(overrides?: Partial<T>): T {
    return this.make(overrides) as T;
  }

  /**
   * Create multiple raw objects without persisting
   */
  public rawMany(count: number, overrides?: Partial<T>): T[] {
    return this.times(count).make(overrides) as T[];
  }
}

/**
 * Simple factory function creator for quick test data generation
 */
export function defineFactory<T>(definition: () => T): FactoryFunction<T> {
  return (overrides?: Partial<T>) => {
    return {
      ...definition(),
      ...(overrides || {}),
    };
  };
}

/**
 * Sequence helper for generating sequential values
 */
export class Sequence {
  private static counters: Map<string, number> = new Map();

  static next(key: string, start = 1): number {
    const current = this.counters.get(key) || start;
    this.counters.set(key, current + 1);
    return current;
  }

  static reset(key?: string): void {
    if (key) {
      this.counters.delete(key);
    } else {
      this.counters.clear();
    }
  }
}

/**
 * Faker-like random data generators
 */
export const fake = {
  /**
   * Generate a random string
   */
  string: (length = 10): string => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Generate a random email
   */
  email: (): string => {
    return `${fake.string(8)}@test.com`;
  },

  /**
   * Generate a random number
   */
  number: (min = 0, max = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate a random boolean
   */
  boolean: (): boolean => {
    return Math.random() > 0.5;
  },

  /**
   * Generate a random UUID
   */
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Generate a random date
   */
  date: (start?: Date, end?: Date): Date => {
    const startTime = start
      ? start.getTime()
      : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const endTime = end ? end.getTime() : Date.now();
    return new Date(startTime + Math.random() * (endTime - startTime));
  },

  /**
   * Pick a random element from an array
   */
  pick: <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Generate a random name
   */
  name: (): string => {
    const names = [
      'Alice',
      'Bob',
      'Charlie',
      'David',
      'Eve',
      'Frank',
      'Grace',
      'Henry',
    ];
    return fake.pick(names);
  },

  /**
   * Generate a random text
   */
  text: (words = 10): string => {
    const wordList = [
      'the',
      'be',
      'to',
      'of',
      'and',
      'a',
      'in',
      'that',
      'have',
      'I',
      'it',
      'for',
      'not',
      'on',
      'with',
      'he',
      'as',
      'you',
      'do',
      'at',
    ];
    const result: string[] = [];
    for (let i = 0; i < words; i++) {
      result.push(fake.pick(wordList));
    }
    return result.join(' ');
  },
};
