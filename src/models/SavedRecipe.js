import mongoose from 'mongoose';

/**
 * Saved Recipe Schema
 * Tracks which recipes a user has saved
 * Aligned with frontend SavedRecipeSummary interface
 */
const savedRecipeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
      description: 'Firebase UID of user who saved the recipe',
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: [true, 'Recipe ID is required'],
      index: true,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes must not exceed 1000 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must not exceed 5'],
    },
    savedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

// Compound index to ensure a user can't save the same recipe twice
savedRecipeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

// Index for sorting by save date
savedRecipeSchema.index({ userId: 1, savedAt: -1 });

const SavedRecipe = mongoose.model('SavedRecipe', savedRecipeSchema);

export default SavedRecipe;
