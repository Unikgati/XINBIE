import prisma from './src/config/database';

async function main() {
  const cats = await prisma.category.findMany();
  console.log(cats);
}

main();
