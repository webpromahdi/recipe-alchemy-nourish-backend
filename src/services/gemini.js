import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API for recipe generation
 */

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI client
 * @throws {Error} If GEMINI_API_KEY is not configured
 */
export const initializeGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  return model;
};

/**
 * Generate recipe using Gemini AI
 * @param {Object} params - Recipe generation parameters
 * @returns {Promise<Object>} Generated recipe data
 */
export const generateRecipe = async (params) => {
  const aiModel = initializeGemini();

  const prompt = buildRecipePrompt(params);

  try {
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const recipeData = JSON.parse(jsonText);
    return recipeData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("AI returned invalid JSON format");
    }
    throw new Error(`Recipe generation failed: ${error.message}`);
  }
};

/**
 * Build structured prompt for Gemini
 * @param {Object} params - User preferences and constraints
 * @returns {string} Formatted prompt
 */
const buildRecipePrompt = (params) => {
  const {
    dietaryPreferences = [],
    allergies = [],
    nutritionalFocus = "",
    cuisineType = "",
    maxPrepTime,
    maxCookTime,
    maxCalories,
    servings = 4,
    difficulty = "Medium",
    availableIngredients = [],
    excludeIngredients = [],
    mealType = "",
  } = params;

  const constraints = [];

  if (dietaryPreferences.length > 0) {
    constraints.push(`Dietary preferences: ${dietaryPreferences.join(", ")}`);
  }

  if (allergies.length > 0) {
    constraints.push(`STRICT ALLERGIES (must avoid): ${allergies.join(", ")}`);
  }

  if (nutritionalFocus) {
    constraints.push(`Nutritional focus: ${nutritionalFocus}`);
  }

  if (cuisineType) {
    constraints.push(`Cuisine type: ${cuisineType}`);
  }

  if (maxPrepTime) {
    constraints.push(`Maximum prep time: ${maxPrepTime} minutes`);
  }

  if (maxCookTime) {
    constraints.push(`Maximum cook time: ${maxCookTime} minutes`);
  }

  if (maxCalories) {
    constraints.push(`Maximum calories per serving: ${maxCalories}`);
  }

  if (availableIngredients.length > 0) {
    constraints.push(
      `Prefer using these ingredients: ${availableIngredients.join(", ")}`
    );
  }

  if (excludeIngredients.length > 0) {
    constraints.push(`Must NOT use: ${excludeIngredients.join(", ")}`);
  }

  return `You are a professional chef and certified nutritionist. Generate an ORIGINAL, creative, and realistic recipe.

REQUIREMENTS:
- Servings: ${servings}
- Difficulty level: ${difficulty}
${mealType ? `- Meal type: ${mealType}` : ""}
${constraints.map((c) => `- ${c}`).join("\n")}

CRITICAL RULES:
1. Create an ORIGINAL recipe, not a copy of existing recipes
2. Ensure all ingredients are safe and realistic
3. Respect ALL dietary restrictions and allergies
4. Provide accurate nutritional information
5. Include practical cooking instructions
6. Time estimates must be realistic

OUTPUT FORMAT:
Return ONLY valid JSON matching this EXACT structure (no markdown, no explanations):

{
  "title": "Creative Recipe Name",
  "subtitle": "Brief catchy description",
  "description": "Detailed 2-3 sentence description highlighting key flavors and appeal",
  "prepTime": "XX min",
  "cookTime": "XX min",
  "servings": ${servings},
  "calories": number (per serving),
  "difficulty": "${difficulty}",
  "tags": ["tag1", "tag2", "tag3"],
  "cuisine": "${cuisineType || "International"}",
  "imageUrl": "",
  "nutrition": {
    "protein": "XXg",
    "carbs": "XXg",
    "fat": "XXg",
    "fiber": "XXg",
    "sodium": "XXXmg",
    "sugar": "XXg"
  },
  "ingredients": [
    { "amount": "1 cup", "item": "ingredient name" }
  ],
  "dressingIngredients": [],
  "steps": [
    {
      "number": 1,
      "title": "Step Title",
      "description": "Detailed instructions for this step",
      "tip": "Optional helpful tip",
      "duration": "X min"
    }
  ],
  "shoppingList": [
    {
      "category": "Produce",
      "items": ["item1", "item2"]
    },
    {
      "category": "Protein",
      "items": ["item1"]
    },
    {
      "category": "Pantry",
      "items": ["item1", "item2"]
    }
  ],
  "youtubeId": "",
  "videoUrl": "",
  "isGenerated": true
}

Generate the recipe now:`;
};

export default {
  initializeGemini,
  generateRecipe,
};
