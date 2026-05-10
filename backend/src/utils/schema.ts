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
