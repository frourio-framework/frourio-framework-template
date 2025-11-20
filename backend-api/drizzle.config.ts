import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default {
  schema: './database/drizzle/schema/*',
  out: './database/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
