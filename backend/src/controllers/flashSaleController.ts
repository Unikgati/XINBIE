import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getFlashSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query; // active, upcoming, ended
    const now = new Date();

    let where: any = {};
    if (status === 'active') {
      where = {
        startAt: { lte: now },
        endAt: { gte: now },
        isActive: true
      };
    } else if (status === 'upcoming') {
      where = {
        startAt: { gt: now },
        isActive: true
      };
    } else if (status === 'ended') {
      where = {
        OR: [
          { endAt: { lt: now } },
          { isActive: false }
        ]
      };
    }

    const flashSales = await prisma.flashSale.findMany({
      where,
      include: {
        items: status === 'active' ? {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                unit: true,
                stockQty: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        } : false,
        _count: {
          select: { items: true }
        }
      },
      orderBy: { startAt: 'asc' }
    });

    res.json(flashSales);
  } catch (error) {
    next(error);
  }
};

export const getFlashSaleDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const flashSale = await prisma.flashSale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                stockQty: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!flashSale) {
      throw new AppError('Flash Sale tidak ditemukan', 404);
    }

    res.json(flashSale);
  } catch (error) {
    next(error);
  }
};

export const createFlashSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, startAt, endAt, items } = req.body;

    const flashSale = await prisma.flashSale.create({
      data: {
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            flashPrice: item.flashPrice,
            flashStock: item.flashStock,
            limitPerUser: item.limitPerUser || 1,
            sortOrder: item.sortOrder || 0
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json(flashSale);
  } catch (error) {
    next(error);
  }
};

export const updateFlashSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, startAt, endAt, isActive, items } = req.body;

    const updateData: any = {
      title,
      description,
      isActive,
    };

    if (startAt) updateData.startAt = new Date(startAt);
    if (endAt) updateData.endAt = new Date(endAt);

    if (items) {
      await prisma.flashSaleItem.deleteMany({
        where: { flashSaleId: id }
      });
      updateData.items = {
        create: items.map((item: any) => ({
          productId: item.productId,
          flashPrice: item.flashPrice,
          flashStock: item.flashStock,
          limitPerUser: item.limitPerUser || 1,
          sortOrder: item.sortOrder || 0
        }))
      };
    }

    const flashSale = await prisma.flashSale.update({
      where: { id },
      data: updateData,
      include: {
        items: true
      }
    });

    res.json(flashSale);
  } catch (error) {
    next(error);
  }
};

export const deleteFlashSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.flashSale.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
