const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const drivers = await prisma.user.findMany({
    where: { role: 'DRIVER' }
  });
  console.log(JSON.stringify(drivers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
