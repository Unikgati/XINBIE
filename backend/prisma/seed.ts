import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://dapurgizi:dapurgizi_secret@localhost:5432/dapurgizi',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dapurgizi.store' },
    update: {},
    create: {
      name: 'Admin Dapur Gizi',
      email: 'admin@dapurgizi.store',
      password: adminPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
      phoneWa: '628123456789',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  console.log('\n🌱 Seeding complete!\n');
  console.log('📧 Admin login: admin@dapurgizi.store / Admin123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
