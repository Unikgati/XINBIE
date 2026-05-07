import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('Server Time (UTC):', now.toISOString());
  console.log('Server Time (Local):', now.toLocaleString());
  
  const all = await prisma.flashSale.findMany({
    include: { _count: { select: { items: true } } }
  });
  
  console.log('Total Flash Sales:', all.length);
  all.forEach(s => {
    console.log(`- [${s.id}] ${s.title}: ${s.startAt.toISOString()} to ${s.endAt.toISOString()} (Active: ${s.isActive}) Items: ${s._count.items}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
