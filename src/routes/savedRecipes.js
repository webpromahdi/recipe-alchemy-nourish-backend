import express from "express";
import { SavedRecipe, Recipe } from "../models/index.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  validate,
  saveRecipeSchema,
  updateSavedRecipeSchema,
} from "../validators/schemas.js";
import mongoose from "mongoose";

const router = express.Router();

// ============================================================================
// GET /api/users/me/saved - Get User's Saved Recipes
// ============================================================================
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get all saved recipes for this user
    const savedRecipes = await SavedRecipe.find({ userId })
      .sort({ savedAt: -1 })
      .populate("recipeId")
      .lean();

    // Transform to match frontend SavedRecipeSummary format
    const transformedRecipes = savedRecipes
      .filter((saved) => saved.recipeId) // Filter out any deleted recipes
      .map((saved) => {
        const recipe = saved.recipeId;

        // Calculate total time
        const prepMin = parseInt(recipe.prepTime) || 0;
        const cookMin = parseInt(recipe.cookTime) || 0;
        const totalMin = prepMin + cookMin;
        const time = totalMin > 0 ? `${totalMin} min` : "Unknown";

        return {
          id: recipe._id.toString(),
          userId: saved.userId,
          title: recipe.title,
          cuisine: recipe.cuisine,
          time,
          calories: recipe.calories,
          imageUrl: recipe.imageUrl,
          tags: recipe.tags,
          savedAt: saved.savedAt,
          notes: saved.notes,
          rating: saved.rating,
        };
      });

    res.json({
      success: true,
      data: {
        userId,
        recipes: transformedRecipes,
        totalCount: transformedRecipes.length,
        updatedAt: new Date(),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch saved recipes",
      },
      timestamp: new Date(),
    });
  }
});

// ============================================================================
// POST /api/users/me/saved - Save a Recipe
// ============================================================================
router.post("/", authenticate, validate(saveRecipeSchema), async (req, res) => {
  try {
    const userId = req.user.uid;
    const { recipeId, notes, rating } = req.body;

    // Validate recipe ID format
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid recipe ID format",
        },
        timestamp: new Date(),
      });
    }

    // Check if recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RECIPE_NOT_FOUND",
          message: "Recipe not found",
        },
        timestamp: new Date(),
      });
    }

    // Check if already saved
    const existingSave = await SavedRecipe.findOne({ userId, recipeId });
    if (existingSave) {
      return res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_SAVED",
          message: "Recipe is already saved",
        },
        timestamp: new Date(),
      });
    }

    // Create saved recipe
    const savedRecipe = await SavedRecipe.create({
      userId,
      recipeId,
      notes,
      rating,
    });

    const result = savedRecipe.toObject();

    res.status(201).json({
      success: true,
      data: result,
      message: "Recipe saved successfully",
      timestamp: new Date(),
    });
  } catch (error) {
    // Handle duplicate key error (shouldn't happen due to check above, but just in case)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_SAVED",
          message: "Recipe is already saved",
        },
        timestamp: new Date(),
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "SAVE_ERROR",
        message: "Failed to save recipe",
      },
      timestamp: new Date(),
    });
  }
});

// ============================================================================
// PUT /api/users/me/saved/:recipeId - Update Saved Recipe (notes, rating)
// ============================================================================
router.put(
  "/:recipeId",
  authenticate,
  validate(updateSavedRecipeSchema),
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const { recipeId } = req.params;
      const { notes, rating } = req.body;

      // Validate recipe ID format
      if (!mongoose.Types.ObjectId.isValid(recipeId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid recipe ID format",
          },
          timestamp: new Date(),
        });
      }

      // Find and update saved recipe
      const savedRecipe = await SavedRecipe.findOne({ userId, recipeId });

      if (!savedRecipe) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Saved recipe not found",
          },
          timestamp: new Date(),
        });
      }

      // Update fields
      if (notes !== undefined) savedRecipe.notes = notes;
      if (rating !== undefined) savedRecipe.rating = rating;

      await savedRecipe.save();

      const result = savedRecipe.toObject();

      res.json({
        success: true,
        data: result,
        message: "Saved recipe updated successfully",
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_ERROR",
          message: "Failed to update saved recipe",
        },
        timestamp: new Date(),
      });
    }
  }
);

// ============================================================================
// DELETE /api/users/me/saved/:recipeId - Unsave a Recipe
// ============================================================================
router.delete("/:recipeId", authenticate, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { recipeId } = req.params;

    // Validate recipe ID format
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid recipe ID format",
        },
        timestamp: new Date(),
      });
    }

    // Delete saved recipe
    const result = await SavedRecipe.findOneAndDelete({ userId, recipeId });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Saved recipe not found",
        },
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: "Recipe unsaved successfully",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "DELETE_ERROR",
        message: "Failed to unsave recipe",
      },
      timestamp: new Date(),
    });
  }
});

export default router;
