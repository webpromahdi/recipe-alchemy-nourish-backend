import { z } from "zod";

/**
 * Zod schema for validating AI-generated recipe responses
 * Ensures Gemini output matches our Recipe model exactly
 */

const nutritionSchema = z.object({
  protein: z.string().min(1),
  carbs: z.string().min(1),
  fat: z.string().min(1),
  fiber: z.string().min(1),
  sodium: z.string().optional().default("0mg"),
  sugar: z.string().optional().default("0g"),
  saturatedFat: z.string().optional(),
  cholesterol: z.string().optional(),
});

const ingredientSchema = z.object({
  amount: z.string().min(1),
  item: z.string().min(1),
  id: z.string().optional(),
});

const recipeStepSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  tip: z.string().optional(),
  duration: z.string().optional(),
  imageUrl: z.string().optional(),
});

const shoppingCategorySchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string()).min(1),
});

/**
 * Validates AI-generated recipe output
 */
export const aiRecipeSchema = z.object({
  title: z.string().min(3).max(200),
  subtitle: z.string().optional().default(""),
  description: z.string().min(10).max(2000),
  prepTime: z.string().min(1),
  cookTime: z.string().min(1),
  servings: z.number().int().min(1).max(100),
  calories: z.number().int().min(0).max(5000),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  tags: z.array(z.string()).default([]),
  cuisine: z.string().default("International"),
  imageUrl: z.string().default(""),
  nutrition: nutritionSchema,
  ingredients: z.array(ingredientSchema).min(1),
  dressingIngredients: z.array(ingredientSchema).optional().default([]),
  steps: z.array(recipeStepSchema).min(1),
  shoppingList: z.array(shoppingCategorySchema).default([]),
  youtubeId: z.string().optional().default(""),
  videoUrl: z.string().optional().default(""),
  isGenerated: z.boolean().default(true),
});

/**
 * Validate and sanitize AI recipe response
 * @param {Object} data - Raw AI response
 * @returns {Object} Validated and sanitized recipe
 * @throws {z.ZodError} If validation fails
 */
export const validateAIRecipe = (data) => {
  return aiRecipeSchema.parse(data);
};

export default {
  aiRecipeSchema,
  validateAIRecipe,
};
