import prisma from './src/config/database';
prisma.deliverySlot.findMany().then(r => console.log(r)).catch(console.error).finally(() => process.exit(0));
