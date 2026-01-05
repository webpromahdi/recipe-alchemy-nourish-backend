import express from "express";
import { Recipe } from "../models/index.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";
import {
  validate,
  validateQuery,
  createRecipeSchema,
  updateRecipeSchema,
  recipeSearchSchema,
  recipeGenerationSchema,
} from "../validators/schemas.js";
import mongoose from "mongoose";

const router = express.Router();

// ============================================================================
// GET /api/recipes - Search/List Recipes
// ============================================================================
router.get(
  "/",
  optionalAuth,
  validateQuery(recipeSearchSchema),
  async (req, res) => {
    try {
      const {
        query,
        dietaryPreferences,
        allergies,
        cuisines,
        tags,
        maxPrepTime,
        maxCookTime,
        maxCalories,
        minCalories,
        difficulty,
        sortBy,
        sortOrder,
        page,
        pageSize,
      } = req.query;

      // Build filter query
      const filter = {};

      // Text search
      if (query) {
        filter.$text = { $search: query };
      }

      // Filter by tags (recipe must have ALL specified tags)
      if (tags && tags.length > 0) {
        filter.tags = { $all: tags };
      }

      // Filter by cuisine
      if (cuisines && cuisines.length > 0) {
        filter.cuisine = { $in: cuisines };
      }

      // Filter by difficulty
      if (difficulty && difficulty.length > 0) {
        filter.difficulty = { $in: difficulty };
      }

      // Filter by calories
      if (maxCalories || minCalories) {
        filter.calories = {};
        if (maxCalories) filter.calories.$lte = maxCalories;
        if (minCalories) filter.calories.$gte = minCalories;
      }

      // TODO: Implement time-based filtering (requires parsing prepTime/cookTime)
      // For now, skipping maxPrepTime and maxCookTime

      // Build sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with pagination
      const skip = (page - 1) * pageSize;

      const [recipes, total] = await Promise.all([
        Recipe.find(filter).sort(sortOptions).skip(skip).limit(pageSize).lean(),
        Recipe.countDocuments(filter),
      ]);

      // Transform recipes to match frontend format
      const transformedRecipes = recipes.map((recipe) => ({
        ...recipe,
        __v: undefined,
      }));

      // Return response in frontend-expected format
      res.json({
        success: true,
        data: {
          recipes: transformedRecipes,
          pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
          filters: {
            appliedFilters: req.query,
          },
        },
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "FETCH_ERROR",
          message: "Failed to fetch recipes",
        },
        timestamp: new Date(),
      });
    }
  }
);

// ============================================================================
// GET /api/recipes/:id - Get Recipe by ID
// ============================================================================
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid recipe ID format",
        },
        timestamp: new Date(),
      });
    }

    const recipe = await Recipe.findById(id).lean();

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Recipe not found",
        },
        timestamp: new Date(),
      });
    }

    // Transform to match frontend format
    const transformedRecipe = {
      ...recipe,
      __v: undefined,
    };

    res.json({
      success: true,
      data: transformedRecipe,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch recipe",
      },
      timestamp: new Date(),
    });
  }
});

// ============================================================================
// POST /api/recipes - Create Recipe
// ============================================================================
router.post(
  "/",
  authenticate,
  validate(createRecipeSchema),
  async (req, res) => {
    try {
      const recipeData = {
        ...req.body,
        userId: req.user.uid, // Attach authenticated user's Firebase UID
      };

      const recipe = await Recipe.create(recipeData);
      const savedRecipe = recipe.toObject();

      res.status(201).json({
        success: true,
        data: savedRecipe,
        message: "Recipe created successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Recipe validation failed",
            details: Object.values(error.errors).map((err) => err.message),
          },
          timestamp: new Date(),
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "CREATE_ERROR",
          message: "Failed to create recipe",
        },
        timestamp: new Date(),
      });
    }
  }
);

// ============================================================================
// PUT /api/recipes/:id - Update Recipe
// ============================================================================
router.put(
  "/:id",
  authenticate,
  validate(updateRecipeSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid recipe ID format",
          },
          timestamp: new Date(),
        });
      }

      const recipe = await Recipe.findById(id);

      if (!recipe) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Recipe not found",
          },
          timestamp: new Date(),
        });
      }

      // Check if user owns this recipe
      if (recipe.userId && recipe.userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to update this recipe",
          },
          timestamp: new Date(),
        });
      }

      // Update recipe
      Object.assign(recipe, req.body);
      await recipe.save();

      const updatedRecipe = recipe.toObject();

      res.json({
        success: true,
        data: updatedRecipe,
        message: "Recipe updated successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Recipe validation failed",
            details: Object.values(error.errors).map((err) => err.message),
          },
          timestamp: new Date(),
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_ERROR",
          message: "Failed to update recipe",
        },
        timestamp: new Date(),
      });
    }
  }
);

// ============================================================================
// DELETE /api/recipes/:id - Delete Recipe
// ============================================================================
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid recipe ID format",
        },
        timestamp: new Date(),
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Recipe not found",
        },
        timestamp: new Date(),
      });
    }

    // Check if user owns this recipe
    if (recipe.userId && recipe.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to delete this recipe",
        },
        timestamp: new Date(),
      });
    }

    await Recipe.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Recipe deleted successfully",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "DELETE_ERROR",
        message: "Failed to delete recipe",
      },
      timestamp: new Date(),
    });
  }
});

// ============================================================================
// POST /api/recipes/generate - Generate Recipe with AI (Stub)
// ============================================================================
router.post(
  "/generate",
  authenticate,
  validate(recipeGenerationSchema),
  async (req, res) => {
    try {
      const params = req.body;

      // TODO: Integrate with AI service (OpenAI, Anthropic, etc.)
      // For now, return a mock generated recipe aligned with frontend model

      const mockRecipe = {
        userId: req.user.uid,
        title: `${params.cuisineType || "Delicious"} ${
          params.mealType || "Meal"
        }`,
        subtitle: "AI-Generated Recipe",
        description: `A delicious ${
          params.cuisineType || "international"
        } dish tailored to your preferences.`,
        prepTime: "15 min",
        cookTime: "25 min",
        servings: params.servings || 4,
        calories: params.maxCalories || 350,
        difficulty: params.difficulty || "Medium",
        tags: params.dietaryPreferences || ["Healthy"],
        cuisine: params.cuisineType || "International",
        imageUrl: "https://via.placeholder.com/800x600?text=Recipe+Image",
        nutrition: {
          protein: "18g",
          carbs: "45g",
          fat: "12g",
          fiber: "8g",
          sodium: "450mg",
        },
        ingredients: [
          { amount: "2 cups", item: "Main ingredient" },
          { amount: "1 tbsp", item: "Seasoning" },
          { amount: "1/2 cup", item: "Supporting ingredient" },
        ],
        steps: [
          {
            number: 1,
            title: "Preparation",
            description: "Prepare all ingredients as specified.",
            tip: "Keep ingredients at room temperature for best results.",
          },
          {
            number: 2,
            title: "Cooking",
            description: "Cook according to instructions.",
          },
          {
            number: 3,
            title: "Serving",
            description: "Serve hot and enjoy!",
          },
        ],
        shoppingList: [
          {
            category: "Produce",
            items: ["Main ingredient"],
          },
          {
            category: "Pantry",
            items: ["Seasoning", "Supporting ingredient"],
          },
        ],
        isGenerated: true,
        generationParams: params,
      };

      const recipe = await Recipe.create(mockRecipe);
      const savedRecipe = recipe.toObject();

      res.status(201).json({
        success: true,
        data: {
          recipe: savedRecipe,
          generationId: recipe.id,
          model: "stub-mock-model",
        },
        message: "Recipe generated successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "GENERATION_ERROR",
          message: "Failed to generate recipe",
        },
        timestamp: new Date(),
      });
    }
  }
);

export default router;
