import minioClient from '../config/minio';
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { paginationQuerySchema } from '../utils/schema';

// GET /api/admin/reviews
export async function getAllReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, search, status } = req.query as any;
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 20;

    const where: any = {};
    if (status === 'pending') where.isActive = false;
    if (status === 'published') where.isActive = true;
    
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          product: {
            select: { name: true, slug: true, id: true, images: true }
          }
        }
      }),
      prisma.productReview.count({ where })
    ]);

    res.json({
      data: reviews,
      meta: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
    });
  } catch (err) { next(err); }
}

// PUT /api/admin/reviews/bulk-approve
export async function bulkApproveReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'IDs must be a non-empty array' });
    }

    await prisma.productReview.updateMany({
      where: { id: { in: ids } },
      data: { isActive: true }
    });

    // Note: In enterprise, we might need to recalculate all affected product ratings here.
    // For now, simpler to do it per-product or scheduled. 
    // But for 100% pro, let's recalculate the ratings for products of these reviews.
    const reviews = await prisma.productReview.findMany({
      where: { id: { in: ids } },
      select: { productId: true }
    });
    const productIds = [...new Set(reviews.map(r => r.productId))];

    for (const pid of productIds) {
      const aggregates = await prisma.productReview.aggregate({
        where: { productId: pid, isActive: true },
        _avg: { rating: true }
      });
      await prisma.product.update({
        where: { id: pid },
        data: { ratingAvg: aggregates._avg.rating || 4.8 }
      });
    }

    res.json({ success: true, message: `${ids.length} ulasan berhasil disetujui` });
  } catch (err) { next(err); }
}

// PUT /api/admin/reviews/:id/approve
export async function approveReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const review = await prisma.productReview.update({
      where: { id },
      data: { isActive: true }
    });

    // Update Product average rating
    const aggregates = await prisma.productReview.aggregate({
      where: { productId: review.productId, isActive: true },
      _avg: { rating: true }
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: { ratingAvg: aggregates._avg.rating || 4.8 }
    });

    res.json({ success: true, message: 'Review approved successfully' });
  } catch (err) { next(err); }
}

// DELETE /api/admin/reviews/:id
export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Find review first to get image URLs
    const reviewToDelete = await prisma.productReview.findUnique({ where: { id } });
    if (!reviewToDelete) throw new Error('Review not found');

    // Delete from DB
    await prisma.productReview.delete({ where: { id } });

    // Clean up images from MinIO if any
    if (reviewToDelete.images && Array.isArray(reviewToDelete.images)) {
      const bucketName = process.env.MINIO_BUCKET || 'xinbie';
      for (const imageUrl of (reviewToDelete.images as string[])) {
        try {
          const urlParts = imageUrl.split('/');
          const objectName = urlParts[urlParts.length - 1];
          if (objectName) {
            await minioClient.removeObject(bucketName, objectName);
          }
        } catch (minioErr) {
          console.error('[MinIO] Failed to delete object:', imageUrl, minioErr);
        }
      }
    }

    // Update Product average rating if it was active
    if (reviewToDelete.isActive) {
      const aggregates = await prisma.productReview.aggregate({
        where: { productId: reviewToDelete.productId, isActive: true },
        _avg: { rating: true }
      });

      await prisma.product.update({
        where: { id: reviewToDelete.productId },
        data: { ratingAvg: aggregates._avg.rating || 4.8 }
      });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) { next(err); }
}
