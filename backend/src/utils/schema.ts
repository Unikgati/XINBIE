import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
});

export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform(v => v ? parseInt(v) : 20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  featured: z.string().optional().transform(v => v === 'true'),
  promo: z.string().optional().transform(v => v === 'true'),
  sort: z.string().optional().default('newest'),
  ids: z.string().optional(),
});

export const productVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  price: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
  costPrice: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
  discountPrice: z.union([z.number(), z.string(), z.null()]).optional().transform(v => (v && v !== 'null') ? parseInt(v.toString()) : null),
  stockQty: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString()) || 0),
  imageUrl: z.string().optional().nullable(),
});

export const productBodySchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  price: z.union([z.number(), z.string()]).transform(v => parseInt(v.toString())),
  costPrice: z.union([z.number(), z.string()]).optional().transform(v => v ? parseInt(v.toString()) : 0),
  discountPrice: z.union([z.number(), z.string(), z.null()]).optional().transform(v => (v && v !== 'null') ? parseInt(v.toString()) : null),
  stock: z.union([z.number(), z.string()]).optional().transform(v => v ? parseInt(v.toString()) : 0),
  description: z.string().optional(),
  shopeeUrl: z.string().optional(),
  ratingAvg: z.union([z.number(), z.string()]).optional().transform(v => v ? parseFloat(v.toString()) : 4.8),
  tags: z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v : (v ? v.split(',') : [])),
  sizes: z.union([z.string(), z.array(z.string())]).optional().transform(v => Array.isArray(v) ? v : (v ? v.split(',') : [])),
  variants: z.string().optional().transform(v => v ? JSON.parse(v) : []).pipe(z.array(productVariantSchema)),
  deletedVariants: z.string().optional().transform(v => v ? JSON.parse(v) : []).pipe(z.array(z.string())),
});
