/**
 * Configuration Usage Examples
 *
 * This file demonstrates how to use the configuration system.
 * Run this file in Tinker to see the examples:
 *
 * $ npm run artisan tinker
 * > import('./kaname/config/example')
 */

import { config, configObject, hasConfig, configAll } from './config';

export function demonstrateConfigUsage() {
  console.log('\n=== Configuration System Examples ===\n');

  // Example 1: Function-based access (dot notation)
  console.log('1. Function-Based Configuration Access (dot notation):');
  const appName = config('app.name');
  console.log(`   config('app.name'): ${appName}`);

  const appEnv = config('app.env');
  console.log(`   config('app.env'): ${appEnv}`);

  // Example 2: Property-based access (with type inference)
  console.log('\n2. Property-Based Configuration Access (type-safe):');
  console.log(`   configObject.app.name: ${configObject.app.name}`);
  console.log(`   configObject.app.debug: ${configObject.app.debug}`);
  console.log(`   configObject.app.env: ${configObject.app.env}`);

  // Example 3: Nested values - both methods
  console.log('\n3. Nested Configuration Values:');
  console.log(
    `   Function: config('jwt.secret'): ${config('jwt.secret')?.substring(0, 10)}...`,
  );
  console.log(
    `   Property: configObject.jwt.secret: ${configObject.jwt.secret?.substring(0, 10)}...`,
  );

  console.log(
    `   Function: config('database.connections.default.pool.max'): ${config('database.connections.default.pool.max')}`,
  );
  console.log(
    `   Property: configObject.database.connections.default.pool.max: ${configObject.database.connections.default.pool?.max}`,
  );

  // Example 4: Default values (function only)
  console.log('\n4. Configuration with Defaults (function only):');
  const existingValue = config('app.name', 'Default Name');
  console.log(`   Existing (app.name): ${existingValue}`);

  const nonExistentValue = config('app.nonExistent', 'Fallback Value');
  console.log(`   Non-existent (app.nonExistent): ${nonExistentValue}`);

  // Example 5: Type safety demonstration
  console.log('\n5. Type-Safe Configuration (property access):');
  const debug: boolean = configObject.app.debug;
  console.log(`   Debug mode (boolean): ${debug}`);

  const poolMax: number | undefined = configObject.database.connections.default.pool?.max;
  console.log(`   DB Pool Max (number): ${poolMax}`);

  const jwtAlgorithm: 'HS256' = configObject.jwt.algorithm;
  console.log(`   JWT Algorithm (literal): ${jwtAlgorithm}`);

  // Example 6: Checking existence
  console.log('\n6. Checking Configuration Existence:');
  console.log(`   Has 'app.name': ${hasConfig('app.name')}`);
  console.log(`   Has 'app.nonExistent': ${hasConfig('app.nonExistent')}`);

  // Example 7: Getting all config for a file
  console.log('\n7. Getting All Configuration for a File:');
  const allAppConfig = configAll('app');
  console.log('   All App Config:', JSON.stringify(allAppConfig, null, 2));

  // Example 8: Comparison - which to use when?
  console.log('\n8. When to Use Each Method:');
  console.log('   ✓ Use configObject.app.debug when you need type inference');
  console.log('   ✓ Use config("app.debug") when you need default values');
  console.log('   ✓ Use configObject for better IDE autocomplete');
  console.log('   ✓ Use config() for dynamic config keys');

  console.log('\n=== End of Examples ===\n');
}

// Auto-run when imported in Tinker
demonstrateConfigUsage();
