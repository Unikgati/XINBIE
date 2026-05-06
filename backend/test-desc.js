const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst();
  console.log("DESCRIPTION:");
  console.log(p.description);
}
main().catch(console.error).finally(() => prisma.$disconnect());
