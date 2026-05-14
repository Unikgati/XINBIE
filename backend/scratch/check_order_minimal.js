const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const orders = await prisma.order.findMany({
      where: { code: { in: ['DG-260510-3124', 'DG-260510-8063'] } },
      select: { code: true, orderStatus: true }
    });
    console.log('Orders found:', JSON.stringify(orders, null, 2));
  } catch (e) {
    console.error('Error fetching orders:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
