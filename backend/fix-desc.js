const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({
    where: { description: { contains: '&nbsp;' } }
  });
  console.log(`Found ${products.length} products to fix.`);
  let count = 0;
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { description: p.description.replace(/&nbsp;/g, ' ') }
    });
    count++;
  }
  console.log(`Updated ${count} products.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
