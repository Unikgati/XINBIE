import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// GET /api/addresses
export async function getAddresses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.userId },
      include: {
        province: true,
        city: true,
        district: true,
        village: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(addresses);
  } catch (err) { next(err); }
}

// POST /api/addresses
export async function createAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { recipientName, phoneWa, lat, lng, fullAddress, notes, isPrimary, provinceId, cityId, districtId, villageId } = req.body;

    if (isPrimary) {
      await prisma.address.updateMany({
        where: { userId: req.userId! },
        data: { isPrimary: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.userId!,
        recipientName,
        phoneWa,
        lat: lat || null,
        lng: lng || null,
        fullAddress,
        notes,
        provinceId: provinceId || null,
        cityId: cityId || null,
        districtId: districtId || null,
        villageId: villageId || null,
        isPrimary: isPrimary || false,
      },
    });

    res.status(201).json(address);
  } catch (err) { next(err); }
}

// PUT /api/addresses/:id
export async function updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!address) throw new AppError('Alamat tidak ditemukan', 404);

    const { recipientName, phoneWa, lat, lng, fullAddress, notes, isPrimary, provinceId, cityId, districtId, villageId } = req.body;

    if (isPrimary === true) {
      await prisma.address.updateMany({
        where: { userId: req.userId! },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: {
        ...(recipientName !== undefined && { recipientName }),
        ...(phoneWa !== undefined && { phoneWa }),
        ...(lat !== undefined && { lat: lat || null }),
        ...(lng !== undefined && { lng: lng || null }),
        ...(fullAddress !== undefined && { fullAddress }),
        ...(notes !== undefined && { notes }),
        ...(provinceId !== undefined && { provinceId: provinceId || null }),
        ...(cityId !== undefined && { cityId: cityId || null }),
        ...(districtId !== undefined && { districtId: districtId || null }),
        ...(villageId !== undefined && { villageId: villageId || null }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
    });

    res.json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/addresses/:id
export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!address) throw new AppError('Alamat tidak ditemukan', 404);

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Alamat dihapus' });
  } catch (err) { next(err); }
}

// PUT /api/addresses/:id/set-primary
export async function setPrimaryAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId: req.userId! },
        data: { isPrimary: false },
      }),
      prisma.address.update({
        where: { id: req.params.id },
        data: { isPrimary: true },
      }),
    ]);
    res.json({ message: 'Alamat utama diubah' });
  } catch (err) { next(err); }
}
