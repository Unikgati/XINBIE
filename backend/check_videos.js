
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const videos = await prisma.cookingVideo.findMany();
  console.log(JSON.stringify(videos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
