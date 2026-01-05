# Gemini AI Integration Guide

## Overview

The Recipe Alchemy Nourish backend now uses **Google's Gemini 1.5 Pro** AI model to generate high-quality, original recipes based on user preferences.

---

## 🔐 Security Architecture

✅ **API Key stored securely** - Only in backend environment variables  
✅ **Never exposed to frontend** - All AI calls happen server-side  
✅ **Firebase authentication required** - All generation requests must be authenticated  
✅ **Rate limiting applied** - Prevents abuse  
✅ **Input validation** - Zod schemas validate all user inputs  
✅ **Output validation** - AI responses validated before saving  

---

## 📦 Setup Instructions

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Create a new API key or use existing one
5. Copy the API key

### 2. Add to Environment Variables

Add to your `.env` file:

```env
GEMINI_API_KEY=your-actual-api-key-here
```

⚠️ **NEVER commit this file to Git!**

### 3. Verify Installation

```bash
npm install
npm run dev
```

If `GEMINI_API_KEY` is missing, the server will fail to start with a clear error message.

---

## 🎯 How It Works

### Request Flow

```
1. Frontend → POST /api/recipes/generate with parameters
2. Backend → Validates Firebase token (authentication)
3. Backend → Validates request body (Zod schema)
4. Backend → Builds structured prompt for Gemini
5. Gemini → Generates recipe JSON
6. Backend → Validates AI response (Zod schema)
7. Backend → Saves validated recipe to MongoDB
8. Backend → Returns recipe to frontend
```

### Retry Logic

- **Max retries**: 2 attempts
- **Retry trigger**: Invalid JSON or validation failure
- **Delay**: 1 second between retries
- **Failure handling**: Returns clear error message after exhausting retries

---

## 🔧 API Endpoint

### `POST /api/recipes/generate`

**Authentication**: Required (Firebase ID token)

**Request Body**:
```json
{
  "dietaryPreferences": ["Vegetarian", "High-Protein"],
  "allergies": ["Peanuts", "Shellfish"],
  "nutritionalFocus": "High-Protein",
  "cuisineType": "Italian",
  "maxPrepTime": 30,
  "maxCookTime": 45,
  "maxCalories": 600,
  "servings": 4,
  "difficulty": "Medium",
  "availableIngredients": ["Chicken", "Tomatoes"],
  "excludeIngredients": ["Mushrooms"],
  "mealType": "Dinner"
}
```

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "recipe": {
      "_id": "677abc123...",
      "title": "Mediterranean Herb-Crusted Chicken",
      "description": "...",
      "prepTime": "20 min",
      "cookTime": "35 min",
      "servings": 4,
      "calories": 520,
      "difficulty": "Medium",
      "cuisine": "Italian",
      "ingredients": [...],
      "steps": [...],
      "nutrition": {...},
      "shoppingList": [...],
      "isGenerated": true
    },
    "generationId": "677abc123...",
    "model": "gemini-1.5-pro"
  },
  "message": "Recipe generated successfully",
  "timestamp": "2026-01-05T..."
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE | AI_VALIDATION_FAILED | GENERATION_ERROR",
    "message": "Descriptive error message"
  },
  "timestamp": "2026-01-05T..."
}
```

---

## 🧠 AI Prompt Strategy

### Structured Prompting

The backend builds a detailed, constraint-driven prompt that instructs Gemini to:

1. **Act as a professional chef and nutritionist**
2. **Generate original recipes** (not copies)
3. **Respect all user constraints**:
   - Dietary preferences (Vegan, Keto, etc.)
   - Allergies (STRICT enforcement)
   - Nutritional goals
   - Time limits
   - Calorie limits
   - Cuisine preferences
4. **Return ONLY valid JSON** (no markdown, no explanations)
5. **Match exact schema structure**

### Temperature & Model Settings

```javascript
{
  model: 'gemini-1.5-pro',
  temperature: 0.7,      // Balance creativity vs. reliability
  topK: 40,             // Consider top 40 tokens
  topP: 0.95,           // Nucleus sampling threshold
  maxOutputTokens: 8192 // Allow detailed recipes
}
```

---

## ✅ Validation Strategy

### Two-Layer Validation

**Layer 1: Input Validation**
- User request validated with `recipeGenerationSchema` (Zod)
- Ensures all parameters are properly typed
- Prevents invalid data from reaching AI

**Layer 2: Output Validation**
- AI response validated with `aiRecipeSchema` (Zod)
- Ensures recipe matches frontend data model
- Catches hallucinations or malformed responses

### Validation Schema

```javascript
{
  title: string (3-200 chars),
  description: string (10-2000 chars),
  prepTime: string,
  cookTime: string,
  servings: number (1-100),
  calories: number (0-5000),
  difficulty: "Easy" | "Medium" | "Hard",
  ingredients: array (min 1 item),
  steps: array (min 1 step),
  nutrition: { protein, carbs, fat, fiber, ... },
  tags: array,
  shoppingList: array,
  // ... more fields
}
```

---

## 🚨 Error Handling

### Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `AI_SERVICE_UNAVAILABLE` | Missing GEMINI_API_KEY | 503 |
| `AI_INVALID_RESPONSE` | Gemini returned non-JSON | 500 |
| `AI_VALIDATION_FAILED` | Recipe failed schema validation after retries | 500 |
| `GENERATION_ERROR` | Generic AI generation failure | 500 |
| `VALIDATION_ERROR` | User input validation failed | 400 |
| `MISSING_TOKEN` | No Firebase token provided | 401 |

---

## 📊 Monitoring & Debugging

### What to Monitor

- **Generation success rate**: Track successful vs. failed generations
- **Validation failures**: How often does AI output fail validation?
- **Response times**: Average time for recipe generation
- **Retry rates**: How often does the system need to retry?
- **Error types**: Which errors occur most frequently?

### Debugging Tips

1. **Check environment variables**: Ensure `GEMINI_API_KEY` is set
2. **Verify Firebase auth**: Ensure frontend sends valid ID token
3. **Inspect Gemini response**: Add temporary logging to see raw AI output
4. **Test with simple prompts**: Start with minimal parameters
5. **Review validation errors**: Zod provides detailed error messages

---

## 🔒 Production Best Practices

✅ **Use environment variables** - Never hardcode API keys  
✅ **Enable rate limiting** - Already configured (100 req/15min)  
✅ **Monitor API usage** - Track Gemini quota in Google Cloud Console  
✅ **Set up billing alerts** - Prevent unexpected charges  
✅ **Log errors (not responses)** - Keep logs minimal for security  
✅ **Use HTTPS in production** - Encrypt all traffic  
✅ **Rotate API keys periodically** - Security hygiene  

---

## 💰 Cost Management

### Gemini Pricing (as of 2026)

- **Free tier**: 60 requests per minute
- **Paid tier**: Pay per 1M tokens

### Optimization Tips

1. **Use efficient prompts** - Avoid unnecessary verbosity
2. **Cache common generations** - Store popular recipe types
3. **Implement request limits** - Per-user daily limits
4. **Monitor quota usage** - Set alerts in Google Cloud

---

## 🧪 Testing

### Manual Testing with cURL

```bash
# Get Firebase ID token from your app
export TOKEN="your-firebase-id-token"

curl -X POST http://localhost:5000/api/recipes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cuisineType": "Italian",
    "mealType": "Dinner",
    "servings": 4,
    "difficulty": "Medium",
    "maxCalories": 600,
    "dietaryPreferences": ["Healthy"]
  }'
```

### Expected Behavior

✅ Recipe generation completes in 5-15 seconds  
✅ Response includes complete recipe with all fields  
✅ Recipe is saved to MongoDB with `isGenerated: true`  
✅ Recipe matches frontend `Recipe` interface exactly  

---

## 📚 Architecture Files

### Key Files Created/Modified

```
src/
├── services/
│   └── gemini.js                     # Gemini AI integration
├── validators/
│   └── aiResponseSchema.js           # AI output validation
├── config/
│   └── env.js                        # Environment validation
├── routes/
│   └── recipes.js                    # Updated generation endpoint
└── server.js                         # Added env validation
```

---

## 🎓 Learn More

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Prompt Engineering Best Practices](https://ai.google.dev/docs/prompt_best_practices)
- [Zod Validation](https://zod.dev/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🐛 Troubleshooting

### "Missing required environment variables: GEMINI_API_KEY"

**Solution**: Add `GEMINI_API_KEY=your-key` to `.env` file

### "AI service is not configured"

**Solution**: Same as above - API key not found

### "AI generated invalid recipe format after retries"

**Solution**: 
- Check Gemini API status
- Review prompt in `src/services/gemini.js`
- Temporarily log raw AI response to debug

### "Failed to generate recipe"

**Solution**:
- Check Gemini quota/billing in Google Cloud Console
- Verify API key is valid
- Test with simpler generation parameters

---

**✅ Gemini AI integration is production-ready!**

For support, check logs or contact the development team.
