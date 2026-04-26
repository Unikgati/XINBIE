import prisma from './src/config/database';
async function main() {
  const slots = [
    { dayOfWeek: 1, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 1, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 2, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 2, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 3, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 3, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 4, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 4, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 5, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 5, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 6, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 6, label: 'Siang', startTime: '12:00', endTime: '16:00' },
    { dayOfWeek: 0, label: 'Pagi', startTime: '08:00', endTime: '12:00' },
    { dayOfWeek: 0, label: 'Siang', startTime: '12:00', endTime: '16:00' }
  ];
  for (const s of slots) { await prisma.deliverySlot.create({ data: s }); }
  console.log('Seeded');
}
main().catch(console.error).finally(() => process.exit(0));
