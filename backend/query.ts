import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER' },
    select: { email: true, phoneWa: true, name: true, driverProfile: true }
  });
  console.log(JSON.stringify(drivers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
