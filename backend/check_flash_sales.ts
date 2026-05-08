import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const flashSales = await prisma.flashSale.findMany({
    include: {
      _count: {
        select: { items: true }
      }
    }
  });
  console.log(JSON.stringify(flashSales, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
