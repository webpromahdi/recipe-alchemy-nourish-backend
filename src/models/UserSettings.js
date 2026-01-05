import mongoose from 'mongoose';

/**
 * User Settings Schema
 * Stores user preferences and settings
 * Aligned with frontend UserSettings interface
 */
const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
      description: 'Firebase UID',
    },
    // Dietary preferences (saved for quick access)
    defaultDietaryPreferences: {
      type: [String],
      default: [],
    },
    defaultAllergies: {
      type: [String],
      default: [],
    },
    defaultNutritionalFocus: {
      type: String,
    },
    defaultCuisine: {
      type: [String],
      default: [],
    },
    // UI preferences
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: false,
      },
      newRecipes: {
        type: Boolean,
        default: true,
      },
      savedRecipeUpdates: {
        type: Boolean,
        default: false,
      },
      newsletter: {
        type: Boolean,
        default: false,
      },
    },
    // Account settings
    language: {
      type: String,
      default: 'en',
    },
    measurementSystem: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric',
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

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;
