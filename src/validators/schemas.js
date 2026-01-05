import { z } from 'zod';

/**
 * Zod Validators
 * Aligned with frontend validation rules and data models
 */

// ============================================================================
// RECIPE VALIDATORS
// ============================================================================

const nutritionSchema = z.object({
  protein: z.string().min(1, 'Protein is required'),
  carbs: z.string().min(1, 'Carbs are required'),
  fat: z.string().min(1, 'Fat is required'),
  fiber: z.string().min(1, 'Fiber is required'),
  sodium: z.string().optional(),
  sugar: z.string().optional(),
  saturatedFat: z.string().optional(),
  cholesterol: z.string().optional(),
});

const ingredientSchema = z.object({
  amount: z.string().min(1, 'Ingredient amount is required'),
  item: z.string().min(1, 'Ingredient item is required'),
  id: z.string().optional(),
});

const recipeStepSchema = z.object({
  number: z.number().int().positive('Step number must be positive'),
  title: z.string().min(1, 'Step title is required'),
  description: z.string().min(1, 'Step description is required'),
  tip: z.string().optional(),
  duration: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

const shoppingCategorySchema = z.object({
  category: z.string().min(1, 'Category name is required'),
  items: z.array(z.string()).min(1, 'Category must have at least one item'),
});

export const createRecipeSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  subtitle: z.string().trim().optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  prepTime: z.string().min(1, 'Prep time is required'),
  cookTime: z.string().min(1, 'Cook time is required'),
  servings: z
    .number()
    .int('Servings must be an integer')
    .min(1, 'Servings must be at least 1')
    .max(100, 'Servings must not exceed 100'),
  calories: z
    .number()
    .int('Calories must be an integer')
    .min(0, 'Calories cannot be negative')
    .max(5000, 'Calories seems too high'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'], {
    errorMap: () => ({ message: 'Difficulty must be Easy, Medium, or Hard' }),
  }),
  tags: z.array(z.string()).default([]),
  cuisine: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  nutrition: nutritionSchema,
  ingredients: z
    .array(ingredientSchema)
    .min(1, 'Recipe must have at least one ingredient'),
  dressingIngredients: z.array(ingredientSchema).optional(),
  steps: z
    .array(recipeStepSchema)
    .min(1, 'Recipe must have at least one step'),
  shoppingList: z.array(shoppingCategorySchema).default([]),
  youtubeId: z.string().optional(),
  videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
  isGenerated: z.boolean().default(false),
  generationParams: z.any().optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial();

// ============================================================================
// RECIPE GENERATION VALIDATORS
// ============================================================================

export const recipeGenerationSchema = z.object({
  dietaryPreferences: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  nutritionalFocus: z.string().optional(),
  cuisineType: z.string().optional(),
  maxPrepTime: z.number().int().positive().optional(),
  maxCookTime: z.number().int().positive().optional(),
  maxCalories: z.number().int().positive().max(5000).optional(),
  servings: z.number().int().min(1).max(20).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  availableIngredients: z.array(z.string()).optional(),
  excludeIngredients: z.array(z.string()).optional(),
  mealType: z
    .enum(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'])
    .optional(),
});

// ============================================================================
// SAVED RECIPE VALIDATORS
// ============================================================================

export const saveRecipeSchema = z.object({
  recipeId: z.string().min(1, 'Recipe ID is required'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5')
    .optional(),
});

export const updateSavedRecipeSchema = z.object({
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5')
    .optional(),
});

// ============================================================================
// SEARCH & FILTER VALIDATORS
// ============================================================================

export const recipeSearchSchema = z.object({
  query: z.string().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  cuisines: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  maxPrepTime: z.coerce.number().int().positive().optional(),
  maxCookTime: z.coerce.number().int().positive().optional(),
  maxCalories: z.coerce.number().int().positive().optional(),
  minCalories: z.coerce.number().int().positive().optional(),
  difficulty: z.array(z.enum(['Easy', 'Medium', 'Hard'])).optional(),
  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'title',
      'calories',
      'prepTime',
      'cookTime',
      'difficulty',
    ])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================================
// USER SETTINGS VALIDATORS
// ============================================================================

export const updateUserSettingsSchema = z.object({
  defaultDietaryPreferences: z.array(z.string()).optional(),
  defaultAllergies: z.array(z.string()).optional(),
  defaultNutritionalFocus: z.string().optional(),
  defaultCuisine: z.array(z.string()).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      newRecipes: z.boolean().optional(),
      savedRecipeUpdates: z.boolean().optional(),
      newsletter: z.boolean().optional(),
    })
    .optional(),
  language: z.string().optional(),
  measurementSystem: z.enum(['metric', 'imperial']).optional(),
});

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to validate request body against a Zod schema
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          timestamp: new Date(),
        });
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate query parameters against a Zod schema
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter validation failed',
            details: error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          timestamp: new Date(),
        });
      }
      next(error);
    }
  };
};

export default {
  createRecipeSchema,
  updateRecipeSchema,
  recipeGenerationSchema,
  saveRecipeSchema,
  updateSavedRecipeSchema,
  recipeSearchSchema,
  updateUserSettingsSchema,
  validate,
  validateQuery,
};
