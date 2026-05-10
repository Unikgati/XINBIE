import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { paginationQuerySchema, idParamSchema } from '../utils/schema';
import { processAndUploadImage } from '../middleware/upload';

// ═══════════════════════════════════════
// Public Recipes
// ═══════════════════════════════════════

export async function getRecipes(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, page, limit } = paginationQuerySchema.parse(req.query);
    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          _count: {
            select: { steps: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ]);

    res.json({
      data: recipes.map(r => ({
        ...r,
        stepsCount: r._count?.steps ?? 0
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
}

export async function getRecipeBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: slug } = req.params;
    const recipe = await prisma.recipe.findUnique({
      where: { slug },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }

    // Fetch related products separately because it's a manual array of IDs
    let products: any[] = [];
    if (recipe.relatedProductIds && recipe.relatedProductIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: recipe.relatedProductIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          price: true,
          discountPrice: true,
          discountPercent: true,
          unit: true,
          stockQty: true,
          isUnlimitedStock: true,
          tags: true,
        },
      });
    }

    res.json({ ...recipe, products });
  } catch (err) { next(err); }
}

// ═══════════════════════════════════════
// Admin Recipes CRUD
// ═══════════════════════════════════════

export async function adminGetRecipes(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, page, limit } = paginationQuerySchema.parse(req.query);
    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
          _count: { select: { steps: true } },
        },
      }),
      prisma.recipe.count({ where }),
    ]);

    res.json({
      data: recipes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
}

const parseRecipeData = (body: any) => {
  const data = { ...body };
  


  // Parse JSON arrays

  if (typeof data.relatedProductIds === 'string') {
    try { data.relatedProductIds = JSON.parse(data.relatedProductIds); } catch (e) { data.relatedProductIds = []; }
  }
  if (typeof data.steps === 'string') {
    try { data.steps = JSON.parse(data.steps); } catch (e) { data.steps = []; }
  }
  if (typeof data.ingredients === 'string') {
    try { data.ingredients = JSON.parse(data.ingredients); } catch (e) { data.ingredients = []; }
  }

  return data;
}

const generateUniqueSlug = async (title: string, excludeId?: string) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.recipe.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

export async function adminCreateRecipe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = parseRecipeData(req.body);
    
    let heroImage: string | null = null;
    if (req.files && (req.files as any).heroImage) {
      heroImage = await processAndUploadImage((req.files as any).heroImage[0], 'recipes');
    }

    const slug = await generateUniqueSlug(data.title);

    const recipe = await prisma.recipe.create({
      data: {
        title: data.title,
        slug,

        heroImage,
        ingredients: data.ingredients || [],
        relatedProductIds: data.relatedProductIds || [],
        steps: {
          create: data.steps?.map((step: any, index: number) => ({
            stepNumber: index + 1,
            instruction: step.instruction,
            imageUrl: step.imageUrl || null,
          })) || [],
        },
      },
    });

    res.status(201).json(recipe);
  } catch (err) { next(err); }
}

export async function adminUpdateRecipe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = parseRecipeData(req.body);

    let heroImage: string | undefined;
    if (req.files && (req.files as any).heroImage) {
      heroImage = await processAndUploadImage((req.files as any).heroImage[0], 'recipes');
    }

    const updateData: any = {
      title: data.title,




      relatedProductIds: data.relatedProductIds,
      ingredients: data.ingredients,
    };

    if (heroImage) updateData.heroImage = heroImage;
    if (data.title) {
      updateData.slug = await generateUniqueSlug(data.title, id);
    }

    const recipe = await prisma.$transaction(async (tx) => {
      if (data.steps) {
        await tx.recipeStep.deleteMany({ where: { recipeId: id } });
      }

      return await tx.recipe.update({
        where: { id },
        data: {
          ...updateData,
          steps: data.steps ? {
            create: data.steps.map((step: any, index: number) => ({
              stepNumber: index + 1,
              instruction: step.instruction,
              imageUrl: step.imageUrl || null,
            })),
          } : undefined,
        },
      });
    });

    res.json(recipe);
  } catch (err) { next(err); }
}

export async function adminDeleteRecipe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await prisma.recipe.delete({ where: { id } });
    res.json({ message: 'Resep berhasil dihapus' });
  } catch (err) { next(err); }
}
