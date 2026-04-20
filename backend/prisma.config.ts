import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://dapurgizi:dapurgizi_secret@localhost:5432/dapurgizi',
  },
  migrate: {
    async development() {
      return {
        url: process.env.DATABASE_URL ?? 'postgresql://dapurgizi:dapurgizi_secret@localhost:5432/dapurgizi',
      };
    },
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
