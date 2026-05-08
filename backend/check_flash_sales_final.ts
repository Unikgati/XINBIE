import prisma from './src/config/database';

async function main() {
  try {
    const flashSales = await prisma.flashSale.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
    console.log('FLASH_SALES_START');
    console.log(JSON.stringify(flashSales, null, 2));
    console.log('FLASH_SALES_END');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
