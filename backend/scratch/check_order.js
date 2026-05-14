const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const code = 'DG-260510-8063';
  const order = await prisma.order.findUnique({
    where: { code },
    select: { orderStatus: true, paymentStatus: true }
  });
  console.log('Order:', order);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
