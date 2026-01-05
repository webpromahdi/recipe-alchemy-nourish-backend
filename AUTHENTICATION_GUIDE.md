# 🔐 Firebase Authentication Integration Guide

## Backend Implementation Status ✅

Your backend is **fully secured** with Firebase Authentication. Here's what's already implemented:

### ✅ What's Already Done

1. **Firebase Admin SDK initialized** - Verifies tokens securely
2. **Auth middleware created** - Protects all routes
3. **Token verification** - Uses `admin.auth().verifyIdToken()`
4. **User identity extraction** - Gets `uid` from verified token
5. **Route protection** - All sensitive endpoints are secured
6. **Error handling** - Returns proper 401/403 responses

---

## 🎯 Frontend Integration Guide

### 1️⃣ Get Firebase ID Token (After Login)

```typescript
import { getAuth } from 'firebase/auth';

// After successful login/signup
const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const token = await user.getIdToken();
  console.log('Firebase Token:', token);
}
```

### 2️⃣ Send Token in Every Protected Request

**❌ WRONG - Don't do this:**
```typescript
// Don't manually send userId
fetch('/api/recipes', {
  method: 'POST',
  body: JSON.stringify({ 
    userId: 'some-id',  // ❌ Backend ignores this!
    title: 'My Recipe'
  })
});
```

**✅ CORRECT - Send token in headers:**
```typescript
const token = await auth.currentUser.getIdToken();

fetch('http://localhost:5000/api/recipes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // ✅ Backend verifies this!
  },
  body: JSON.stringify({
    title: 'My Recipe',
    description: 'Delicious meal',
    // ... other recipe data (NO userId needed!)
  })
});
```

### 3️⃣ Create Centralized API Helper (Recommended)

Create `src/utils/api.ts`:

```typescript
import { getAuth } from 'firebase/auth';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Centralized API helper that automatically attaches Firebase token
 */
export const apiClient = {
  /**
   * Make authenticated API request
   */
  async request(endpoint: string, options: RequestInit = {}) {
    try {
      // Get current user's token
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();

      // Merge headers with auth token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        console.error('Unauthorized - token invalid or expired');
        // Optionally: redirect to login
        // window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  // Convenience methods
  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
```

### 4️⃣ Usage Examples

**Create a Recipe:**
```typescript
import { apiClient } from './utils/api';

const createRecipe = async (recipeData) => {
  try {
    const response = await apiClient.post('/recipes', {
      title: 'Healthy Bowl',
      description: 'Nutritious meal',
      prepTime: '15 min',
      cookTime: '20 min',
      servings: 2,
      calories: 350,
      difficulty: 'Easy',
      tags: ['Healthy', 'Quick'],
      nutrition: {
        protein: '18g',
        carbs: '45g',
        fat: '12g',
        fiber: '8g',
      },
      ingredients: [
        { amount: '1 cup', item: 'Quinoa' }
      ],
      steps: [
        {
          number: 1,
          title: 'Cook',
          description: 'Cook the quinoa'
        }
      ],
      shoppingList: [
        {
          category: 'Grains',
          items: ['Quinoa']
        }
      ]
    });

    console.log('Recipe created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create recipe:', error);
  }
};
```

**Save a Recipe:**
```typescript
const saveRecipe = async (recipeId: string) => {
  try {
    const response = await apiClient.post('/users/me/saved', {
      recipeId,
      rating: 5,
      notes: 'Love this!'
    });

    console.log('Recipe saved:', response.data);
  } catch (error) {
    console.error('Failed to save recipe:', error);
  }
};
```

**Get My Saved Recipes:**
```typescript
const getMySavedRecipes = async () => {
  try {
    const response = await apiClient.get('/users/me/saved');
    console.log('Saved recipes:', response.data.recipes);
    return response.data.recipes;
  } catch (error) {
    console.error('Failed to fetch saved recipes:', error);
  }
};
```

**Search Recipes (Public - No Auth Required):**
```typescript
// For public endpoints, you can use regular fetch
const searchRecipes = async (query: string) => {
  const response = await fetch(
    `http://localhost:5000/api/recipes?query=${query}&page=1&pageSize=10`
  );
  const data = await response.json();
  return data.data.recipes;
};
```

---

## 🔒 Security Implementation Details

### Backend Security Features

1. **Token Verification**
   - Every protected route verifies Firebase ID token
   - Uses Firebase Admin SDK's `verifyIdToken()`
   - No manual user ID validation needed

2. **User Identity Extraction**
   - `req.user.uid` contains verified Firebase UID
   - Backend automatically associates data with correct user
   - Frontend CANNOT fake user identity

3. **Protected Routes**
   ```
   POST   /api/recipes              (requires auth)
   PUT    /api/recipes/:id          (requires auth + ownership)
   DELETE /api/recipes/:id          (requires auth + ownership)
   POST   /api/recipes/generate     (requires auth)
   
   GET    /api/users/me/saved       (requires auth)
   POST   /api/users/me/saved       (requires auth)
   PUT    /api/users/me/saved/:id   (requires auth)
   DELETE /api/users/me/saved/:id   (requires auth)
   ```

4. **Public Routes (Optional Auth)**
   ```
   GET /api/recipes              (no auth required)
   GET /api/recipes/:id          (no auth required)
   ```

### How User Data is Secured

**Creating a Recipe:**
```javascript
// Frontend sends (no userId):
{
  "title": "My Recipe",
  "description": "..."
}

// Backend automatically adds userId from verified token:
const recipeData = {
  ...req.body,
  userId: req.user.uid  // ✅ Extracted from verified token
};
```

**Updating a Recipe:**
```javascript
// Backend checks ownership:
if (recipe.userId && recipe.userId !== req.user.uid) {
  return res.status(403).json({
    error: { message: 'You do not have permission' }
  });
}
```

**Fetching Saved Recipes:**
```javascript
// Backend uses authenticated user's ID:
const savedRecipes = await SavedRecipe.find({ 
  userId: req.user.uid  // ✅ Can't access other users' data
});
```

---

## 🧪 Testing Authentication

### Test with curl

**Without Token (Should Fail):**
```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Recipe"}'

# Response: 401 Unauthorized
```

**With Valid Token (Should Succeed):**
```bash
# Get token from Firebase (in your frontend console):
# const token = await auth.currentUser.getIdToken();

curl -X POST http://localhost:5000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN_HERE" \
  -d '{
    "title": "Test Recipe",
    "description": "Testing authentication",
    "prepTime": "10 min",
    "cookTime": "15 min",
    "servings": 2,
    "calories": 250,
    "difficulty": "Easy",
    "tags": ["Test"],
    "nutrition": {
      "protein": "10g",
      "carbs": "30g",
      "fat": "5g",
      "fiber": "3g"
    },
    "ingredients": [{"amount": "1 cup", "item": "Test"}],
    "steps": [{"number": 1, "title": "Test", "description": "Test step"}],
    "shoppingList": [{"category": "Test", "items": ["Test item"]}]
  }'
```

---

## 🚨 Common Issues & Solutions

### Issue 1: 401 Unauthorized
**Cause:** Token not sent or invalid

**Solution:**
```typescript
// Always get fresh token
const token = await auth.currentUser.getIdToken(true); // force refresh
```

### Issue 2: Token Expired
**Cause:** Firebase tokens expire after 1 hour

**Solution:**
```typescript
// Get fresh token automatically
const token = await auth.currentUser.getIdToken(); // auto-refreshes if expired
```

### Issue 3: CORS Error
**Cause:** Frontend origin not allowed

**Solution:** Check backend `.env`:
```env
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
```

### Issue 4: "User not authenticated"
**Cause:** User not logged in

**Solution:**
```typescript
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, can make API calls
    console.log('User logged in:', user.uid);
  } else {
    // User is signed out, redirect to login
    console.log('User logged out');
  }
});
```

---

## ✅ Security Checklist

- [x] Backend verifies Firebase tokens
- [x] User identity extracted from verified token only
- [x] Protected routes require authentication
- [x] User data scoped to authenticated user
- [x] Ownership checks on update/delete
- [x] No userId accepted from frontend
- [x] CORS configured for frontend origin
- [x] Rate limiting enabled
- [x] Error responses don't leak sensitive info
- [x] Firebase credentials stored securely

---

## 🎉 Ready to Use!

Your authentication system is **production-ready**. The frontend just needs to:

1. Get Firebase ID token after login
2. Send it in `Authorization: Bearer <token>` header
3. Let the backend handle user identity securely

**No userId needed in requests - backend handles everything! 🔒**
