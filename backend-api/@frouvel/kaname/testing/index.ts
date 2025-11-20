/**
 * Testing Module
 *
 * Provides comprehensive testing utilities for the frourio-framework
 *
 * @module @frouvel/kaname/testing
 */

export { TestCase } from './TestCase';
export { TestCaseDatabase } from './TestCaseDatabase';
export { TestCaseIntegration } from './TestCaseIntegration';
export { Factory, defineFactory, Sequence, fake } from './Factory';
export type { FactoryFunction, FactoryBuilder } from './Factory';
export { setupTestEnvironment } from './setup';
export type { TestEnvironmentOptions } from './setup';
export { TestApiClient } from './TestApiClient';
export type { ApiResponse } from './TestApiClient';
