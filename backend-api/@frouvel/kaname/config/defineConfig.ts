import type { z } from 'zod';

type DefinedConfig<TSchema extends z.ZodTypeAny> = z.infer<TSchema> & {
  schema: TSchema;
};

/**
 * Shorthand helper to define typed configuration modules.
 * Pass a Zod schema and a loader function that returns raw values.
 *
 * @example
 * const config = defineConfig({
 *   schema: z.object({ foo: z.string() }),
 *   load: () => ({ foo: process.env.FOO || 'bar' }),
 * });
 *
 * export type FooConfig = ConfigType<typeof config>;
 * export const fooConfigSchema = config.schema;
 * export default config;
 */
export function defineConfig<TSchema extends z.ZodTypeAny>(options: {
  schema: TSchema;
  load: () => z.input<TSchema>;
}): DefinedConfig<TSchema> {
  const parsed = options.schema.parse(options.load());
  return Object.assign(parsed, { schema: options.schema });
}

/**
 * Extract the inferred config type from a defineConfig() result.
 */
export type ConfigType<T extends { schema: z.ZodTypeAny }> = T extends {
  schema: infer S extends z.ZodTypeAny;
}
  ? z.infer<S>
  : never;
