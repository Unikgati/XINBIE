import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL ?? 'postgresql://dapurgizi:dapurgizi_secret@localhost:5432/dapurgizi';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Updating all products to have limited stock...');
  const result = await prisma.product.updateMany({
    data: {
      isUnlimitedStock: false,
    }
  });
  console.log(`✅ Updated ${result.count} products.`);
  
  // Specifically for Bawang Merah (slug check)
  await prisma.product.updateMany({
    where: { name: { contains: 'Bawang', mode: 'insensitive' } },
    data: { stockQty: 0 }
  });
  console.log('✅ Bawang products stock set to 0.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
