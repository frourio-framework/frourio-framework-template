import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

prisma
  .$transaction(
    (
      _tx, // eslint-disable-line @typescript-eslint/no-unused-vars
    ) =>
      Promise.all([
        // register your seeder here
      ]),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
