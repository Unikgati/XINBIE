import prisma from './src/config/database';

async function cleanDatabase() {
  console.log('Starting to clean database...');

  // Delete transaction-based items
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  // Delete user-related items
  await prisma.address.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.driverWallet.deleteMany();
  await prisma.driverProfile.deleteMany();

  // Finally delete users
  await prisma.user.deleteMany();

  console.log('Database successfully cleaned! (Categories and Products remain untouched).');
}

cleanDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
