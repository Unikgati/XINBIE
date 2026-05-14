import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL ?? 'postgresql://dapurgizi:dapurgizi_secret@localhost:5432/dapurgizi';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const code = 'DG-260510-3124'; // First one
  const code2 = 'DG-260510-8063'; // Second one
  
  const order1 = await prisma.order.findUnique({
    where: { code },
    select: { orderStatus: true, paymentStatus: true, code: true }
  });
  
  const order2 = await prisma.order.findUnique({
    where: { code: code2 },
    select: { orderStatus: true, paymentStatus: true, code: true }
  });
  
  console.log('Order 1:', order1);
  console.log('Order 2:', order2);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
