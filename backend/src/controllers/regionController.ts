import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

// GET /api/regions/provinces
export async function getProvinces(req: Request, res: Response, next: NextFunction) {
  try {
    let provinces = await prisma.province.findMany({
      orderBy: { name: 'asc' },
    });

    if (provinces.length === 0) {
      try {
        const response = await fetch('https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/static/api/provinces.json');
        if (response.ok) {
          const apiProvinces = await response.json() as any[];
          if (apiProvinces && apiProvinces.length > 0) {
            await prisma.province.createMany({
              data: apiProvinces.map((p: any) => ({ id: p.id, name: p.name })),
              skipDuplicates: true
            });
            provinces = await prisma.province.findMany({ orderBy: { name: 'asc' } });
          }
        }
      } catch (err) {
        console.error('⚠️ Failed to fetch provinces:', err);
      }
    }

    res.json(provinces);
  } catch (err) { next(err); }
}

// GET /api/regions/cities?provinceId=11
export async function getCities(req: Request, res: Response, next: NextFunction) {
  try {
    const { provinceId } = req.query;
    if (!provinceId) {
      res.status(400).json({ message: 'provinceId is required' });
      return;
    }

    let cities = await prisma.city.findMany({
      where: { provinceId: provinceId as string },
      orderBy: { name: 'asc' },
    });

    if (cities.length === 0) {
      try {
        const response = await fetch(`https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/static/api/regencies/${provinceId}.json`);
        if (response.ok) {
          const apiCities = await response.json() as any[];
          if (apiCities && apiCities.length > 0) {
            await prisma.city.createMany({
              data: apiCities.map((c: any) => ({
                id: c.id,
                name: c.name,
                provinceId: provinceId as string
              })),
              skipDuplicates: true
            });
            cities = await prisma.city.findMany({
              where: { provinceId: provinceId as string },
              orderBy: { name: 'asc' },
            });
          }
        }
      } catch (err) {
        console.error(`⚠️ Failed to fetch cities for province ${provinceId}:`, err);
      }
    }

    res.json(cities);
  } catch (err) { next(err); }
}

// GET /api/regions/districts?cityId=1101
export async function getDistricts(req: Request, res: Response, next: NextFunction) {
  try {
    const { cityId } = req.query;
    if (!cityId) {
      res.status(400).json({ message: 'cityId is required' });
      return;
    }

    let districts = await prisma.district.findMany({
      where: { cityId: cityId as string },
      orderBy: { name: 'asc' },
    });

    if (districts.length === 0) {
      try {
        const response = await fetch(`https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/static/api/districts/${cityId}.json`);
        if (response.ok) {
          const apiDistricts = await response.json() as any[];
          if (apiDistricts && apiDistricts.length > 0) {
            await prisma.district.createMany({
              data: apiDistricts.map((d: any) => ({
                id: d.id,
                name: d.name,
                cityId: cityId as string
              })),
              skipDuplicates: true
            });
            districts = await prisma.district.findMany({
              where: { cityId: cityId as string },
              orderBy: { name: 'asc' },
            });
          }
        }
      } catch (err) {
        console.error(`⚠️ Failed to fetch districts for city ${cityId}:`, err);
      }
    }

    res.json(districts);
  } catch (err) { next(err); }
}

// GET /api/regions/villages?districtId=110101
export async function getVillages(req: Request, res: Response, next: NextFunction) {
  try {
    const { districtId } = req.query;
    if (!districtId) {
      res.status(400).json({ message: 'districtId is required' });
      return;
    }
    
    // First check database
    let villages = await prisma.village.findMany({
      where: { districtId: districtId as string },
      orderBy: { name: 'asc' },
    });

    // If empty, fetch from emsifa, cache to db, then return
    if (villages.length === 0) {
      try {
        const response = await fetch(`https://raw.githubusercontent.com/emsifa/api-wilayah-indonesia/master/static/api/villages/${districtId}.json`);
        if (response.ok) {
          const apiVillages = await response.json() as any[];
          if (apiVillages && apiVillages.length > 0) {
            await prisma.village.createMany({
              data: apiVillages.map((v: any) => ({
                id: v.id,
                name: v.name,
                districtId: districtId as string
              })),
              skipDuplicates: true
            });
            // Query again to get them sorted exactly as the DB provides
            villages = await prisma.village.findMany({
              where: { districtId: districtId as string },
              orderBy: { name: 'asc' },
            });
          }
        }
      } catch (err) {
        console.error(`⚠️ Failed to fetch villages for district ${districtId}:`, err);
      }
    }

    res.json(villages);
  } catch (err) { next(err); }
}
