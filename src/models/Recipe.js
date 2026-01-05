import mongoose from "mongoose";

/**
 * Recipe Schema
 * Aligned with frontend Recipe interface
 */
const recipeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      index: true,
      description: "Firebase UID of recipe creator/owner",
    },
    title: {
      type: String,
      required: [true, "Recipe title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title must not exceed 200 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Recipe description is required"],
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description must not exceed 2000 characters"],
    },
    prepTime: {
      type: String,
      required: [true, "Prep time is required"],
    },
    cookTime: {
      type: String,
      required: [true, "Cook time is required"],
    },
    servings: {
      type: Number,
      required: [true, "Number of servings is required"],
      min: [1, "Servings must be at least 1"],
      max: [100, "Servings must not exceed 100"],
    },
    calories: {
      type: Number,
      required: [true, "Calories information is required"],
      min: [0, "Calories cannot be negative"],
      max: [5000, "Calories seems too high"],
    },
    difficulty: {
      type: String,
      required: [true, "Difficulty level is required"],
      enum: {
        values: ["Easy", "Medium", "Hard"],
        message: "Difficulty must be Easy, Medium, or Hard",
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    cuisine: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    nutrition: {
      protein: {
        type: String,
        required: true,
      },
      carbs: {
        type: String,
        required: true,
      },
      fat: {
        type: String,
        required: true,
      },
      fiber: {
        type: String,
        required: true,
      },
      sodium: String,
      sugar: String,
      saturatedFat: String,
      cholesterol: String,
    },
    ingredients: [
      {
        amount: {
          type: String,
          required: true,
        },
        item: {
          type: String,
          required: true,
        },
        id: String,
      },
    ],
    dressingIngredients: [
      {
        amount: {
          type: String,
          required: true,
        },
        item: {
          type: String,
          required: true,
        },
        id: String,
      },
    ],
    steps: [
      {
        number: {
          type: Number,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        tip: String,
        duration: String,
        imageUrl: String,
      },
    ],
    shoppingList: [
      {
        category: {
          type: String,
          required: true,
        },
        items: {
          type: [String],
          required: true,
        },
      },
    ],
    youtubeId: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    isGenerated: {
      type: Boolean,
      default: false,
    },
    generationParams: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for common queries
recipeSchema.index({ userId: 1, createdAt: -1 });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ cuisine: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ calories: 1 });
recipeSchema.index({ title: "text", description: "text" });

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;
