import cron from 'node-cron';
import prisma from '../config/database';

export function initCron() {
  // Prune UniqueActivity table daily at 3 AM
  // We only need logs for the current day to handle "unique per day"
  // Keeping 3 days of logs just in case of timezone overlaps or debugging
  cron.schedule('0 3 * * *', async () => {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const deleted = await prisma.uniqueActivity.deleteMany({
        where: {
          createdAt: { lt: threeDaysAgo }
        }
      });
      
      console.log(`[Cron] Pruned ${deleted.count} old UniqueActivity records.`);
    } catch (err) {
      console.error('[Cron] Error pruning UniqueActivity:', err);
    }
  });

  console.log('⏰ Cron jobs initialized');
}
