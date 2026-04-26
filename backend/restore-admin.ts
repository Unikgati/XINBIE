import prisma from './src/config/database';
import bcrypt from 'bcryptjs';

async function restoreAdmin() {
  console.log('Restoring admin account...');

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dapurgizi.com' },
    update: {},
    create: {
      name: 'Admin Dapur Gizi',
      email: 'admin@dapurgizi.com',
      password: adminPassword,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
      phoneWa: '628123456789',
    },
  });

  console.log(`✅ Admin restored: ${admin.email}`);
}

restoreAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
