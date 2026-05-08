import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.recipe.count();
  console.log('Recipe count:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
