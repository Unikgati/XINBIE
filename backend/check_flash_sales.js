const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const flashSales = await prisma.flashSale.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
    console.log(JSON.stringify(flashSales, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
