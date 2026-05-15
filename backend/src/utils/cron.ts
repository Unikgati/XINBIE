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

  // Prune unapproved/rejected reviews older than 30 days
  cron.schedule('0 4 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find reviews to delete so we can also delete their images from MinIO
      const oldReviews = await prisma.productReview.findMany({
        where: {
          isActive: false,
          createdAt: { lt: thirtyDaysAgo }
        },
        select: { id: true, images: true }
      });

      if (oldReviews.length > 0) {
        // We could implement minioClient.removeObject here
        // For now we just delete from DB, minio has lifecycle policies or we can add it later
        
        const deleted = await prisma.productReview.deleteMany({
          where: {
            id: { in: oldReviews.map(r => r.id) }
          }
        });
        
        console.log(`[Cron] Pruned ${deleted.count} old unapproved ProductReview records.`);
      }
    } catch (err) {
      console.error('[Cron] Error pruning old reviews:', err);
    }
  });

  console.log('⏰ Cron jobs initialized');
}
