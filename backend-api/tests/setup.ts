import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import util from 'util';
import { exec } from 'child_process';
import { getPrismaClient } from '$/@frouvel/kaname/database';
import { env } from '$/env';
import app from '$/bootstrap/app';
import type { HttpKernel } from '$/@frouvel/kaname/foundation';

let server: FastifyInstance;
const prisma = getPrismaClient();

export async function refreshDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
}

const unneededServer = (file: { filepath?: string } | undefined) => {
  // Only start server for integration tests
  return !file?.filepath?.includes('integration.test');
};

const isIntegrationTest = (file: { filepath?: string } | undefined) => {
  return file?.filepath?.includes('integration.test');
};

let isMigrated = false;

beforeAll(async (info) => {
  if (unneededServer({ filepath: info.file.filepath })) return;

  const kernel = app.make<HttpKernel>('HttpKernel');
  server = await kernel.handle();
  // since +1 is used for websocket, +11 is used for testing API server
  await server.listen({ port: env.API_SERVER_PORT + 11, host: '0.0.0.0' });

  if (!isMigrated) {
    await util
      .promisify(exec)('npx prisma migrate deploy')
      .catch((e) => {
        console.error(e);
        console.log('Resetting test DB...');
        util.promisify(exec)('npx prisma migrate reset --force');
      });
    isMigrated = true;
  }
});

beforeEach(async (info) => {
  if (unneededServer({ filepath: info?.task?.file?.name })) return;

  if (isIntegrationTest({ filepath: info?.task?.file?.name })) {
    await refreshDatabase();
    await prisma
      .$transaction(() =>
        Promise.all([
          // Add testing seeds
        ]),
      )
      .catch((e) => {
        console.error(e);
        process.exit(1);
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
  }
});

afterEach(async (info) => {
  if (unneededServer({ filepath: info?.task?.file?.name })) return;

  await prisma.$disconnect();
});

afterAll(async (info) => {
  if (
    unneededServer({
      filepath: info.file.filepath,
    })
  )
    return;

  vi.clearAllMocks();
  vi.clearAllTimers();

  await server.close();
});
