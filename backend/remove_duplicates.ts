import prisma from './src/config/database';
async function clean() {
  const all = await prisma.deliverySlot.findMany();
  const seen = new Set();
  const toDelete = [];
  for (const s of all) {
    const key = `${s.dayOfWeek}_${s.startTime}_${s.endTime}`;
    if (seen.has(key)) {
      toDelete.push(s.id);
    } else {
      seen.add(key);
    }
  }
  if (toDelete.length > 0) {
    await prisma.deliverySlot.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`Deleted ${toDelete.length} duplicates`);
  } else {
    console.log('No duplicates found');
  }
}
clean().catch(console.error).finally(() => process.exit(0));
