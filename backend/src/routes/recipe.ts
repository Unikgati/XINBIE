import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as recipe from '../controllers/recipeController';

const router = Router();

// Public Routes
router.get('/recipes', recipe.getRecipes);
router.get('/recipes/:id', recipe.getRecipeBySlug);

// Admin Routes (Authenticated)
router.get('/admin/recipes', authenticate, requireRole('ADMIN'), recipe.adminGetRecipes);
router.post(
  '/admin/recipes',
  authenticate,
  requireRole('ADMIN'),
  upload.fields([{ name: 'heroImage', maxCount: 1 }]),
  recipe.adminCreateRecipe
);
router.put(
  '/admin/recipes/:id',
  authenticate,
  requireRole('ADMIN'),
  upload.fields([{ name: 'heroImage', maxCount: 1 }]),
  recipe.adminUpdateRecipe
);
router.delete('/admin/recipes/:id', authenticate, requireRole('ADMIN'), recipe.adminDeleteRecipe);

export default router;
