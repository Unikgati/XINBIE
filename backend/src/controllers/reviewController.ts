import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { paginationQuerySchema } from '../utils/schema';

// GET /api/admin/reviews
export async function getAllReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = paginationQuerySchema.parse(req.query);

    const [reviews, total] = await Promise.all([
      prisma.productReview.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: { name: true, slug: true, id: true }
          }
        }
      }),
      prisma.productReview.count()
    ]);

    res.json({
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    // Optional: we can delete the MinIO images here, but the cron job will handle dangling images
    const review = await prisma.productReview.delete({
      where: { id }
    });

    // Update Product average rating if it was active
    if (review.isActive) {
      const aggregates = await prisma.productReview.aggregate({
        where: { productId: review.productId, isActive: true },
        _avg: { rating: true }
      });

      await prisma.product.update({
        where: { id: review.productId },
        data: { ratingAvg: aggregates._avg.rating || 4.8 }
      });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) { next(err); }
}
