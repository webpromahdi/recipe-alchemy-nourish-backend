# Recipe Alchemy Nourish - Backend API

Production-ready backend API for Recipe Alchemy Nourish application, built with Node.js, Express, MongoDB, and Firebase Authentication.

## 🚀 Tech Stack

- **Node.js** (v18+) with ES Modules
- **Express.js** - Web framework
- **MongoDB** with **Mongoose** - Database
- **Firebase Admin SDK** - Authentication
- **Zod** - Request validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Morgan** - HTTP logging

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── firebase.js        # Firebase Admin SDK setup
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification middleware
│   ├── models/
│   │   ├── Recipe.js          # Recipe schema
│   │   ├── SavedRecipe.js     # Saved recipes schema
│   │   ├── UserSettings.js    # User settings schema
│   │   └── index.js           # Model exports
│   ├── routes/
│   │   ├── recipes.js         # Recipe endpoints
│   │   └── savedRecipes.js    # Saved recipes endpoints
│   ├── validators/
│   │   └── schemas.js         # Zod validation schemas
│   ├── app.js                 # Express app configuration
│   └── server.js              # Server entry point
├── .env                       # Environment variables
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies & scripts
└── README.md                  # This file
```

## 🔧 Setup Instructions

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or MongoDB Atlas)
- Firebase project with Admin SDK credentials

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/recipe-alchemy-nourish
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/recipe-alchemy-nourish

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Server
PORT=5000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Set Up Firebase Admin SDK

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Project Settings** → **Service Accounts**
3. Click **Generate New Private Key**
4. Save the JSON file as `serviceAccountKey.json` in the backend root directory
5. Update `.env` with the path: `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`

**Alternative:** Use environment variables instead:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
- Use the connection string from your Atlas cluster in `.env`

### 5. Run the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Health Check
- `GET /health` - Server health status

### Recipes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/recipes` | Optional | Search/list recipes with filters |
| `GET` | `/api/recipes/:id` | Optional | Get recipe by ID |
| `POST` | `/api/recipes` | Required | Create new recipe |
| `PUT` | `/api/recipes/:id` | Required | Update recipe (owner only) |
| `DELETE` | `/api/recipes/:id` | Required | Delete recipe (owner only) |
| `POST` | `/api/recipes/generate` | Required | Generate AI recipe (stub) |

### Saved Recipes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/users/me/saved` | Required | Get user's saved recipes |
| `POST` | `/api/users/me/saved` | Required | Save a recipe |
| `PUT` | `/api/users/me/saved/:recipeId` | Required | Update saved recipe notes/rating |
| `DELETE` | `/api/users/me/saved/:recipeId` | Required | Unsave a recipe |

## 🔐 Authentication

All authenticated endpoints require a Firebase ID token in the `Authorization` header:

```http
Authorization: Bearer <firebase-id-token>
```

The token is verified using Firebase Admin SDK. User information is attached to `req.user`:

```javascript
{
  uid: "firebase-user-uid",
  email: "user@example.com",
  email_verified: true
}
```

## 📝 Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "timestamp": "2026-01-05T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error information"
  },
  "timestamp": "2026-01-05T12:00:00.000Z"
}
```

## 🔍 Example Requests

### Create Recipe
```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Healthy Quinoa Bowl",
    "description": "A nutritious and delicious quinoa bowl",
    "prepTime": "15 min",
    "cookTime": "20 min",
    "servings": 2,
    "calories": 350,
    "difficulty": "Easy",
    "tags": ["Healthy", "Vegetarian"],
    "cuisine": "Mediterranean",
    "nutrition": {
      "protein": "12g",
      "carbs": "45g",
      "fat": "8g",
      "fiber": "10g"
    },
    "ingredients": [
      { "amount": "1 cup", "item": "Quinoa" },
      { "amount": "2 cups", "item": "Mixed vegetables" }
    ],
    "steps": [
      {
        "number": 1,
        "title": "Cook Quinoa",
        "description": "Rinse and cook quinoa according to package directions"
      }
    ],
    "shoppingList": [
      {
        "category": "Grains",
        "items": ["Quinoa"]
      }
    ]
  }'
```

### Search Recipes
```bash
curl "http://localhost:5000/api/recipes?tags=Vegetarian&maxCalories=400&page=1&pageSize=10"
```

### Save Recipe
```bash
curl -X POST http://localhost:5000/api/users/me/saved \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipeId": "507f1f77bcf86cd799439011",
    "rating": 5,
    "notes": "Loved this recipe!"
  }'
```

## 🛡️ Security Features

- **Helmet** - Sets secure HTTP headers
- **CORS** - Configurable cross-origin requests
- **Rate Limiting** - Prevents abuse (100 requests per 15 minutes)
- **Firebase Auth** - Secure token-based authentication
- **Input Validation** - Zod schema validation on all inputs
- **MongoDB Injection Protection** - Mongoose sanitizes queries

## 🧪 Testing

### Manual Testing with curl

Test health endpoint:
```bash
curl http://localhost:5000/health
```

Test authentication (should fail without token):
```bash
curl -X POST http://localhost:5000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
```

## 🚧 TODO / Future Enhancements

- [ ] Integrate real AI service (OpenAI/Anthropic) for recipe generation
- [ ] Add unit and integration tests
- [ ] Implement user profile endpoints
- [ ] Add recipe rating and review system
- [ ] Implement advanced search with full-text and filters
- [ ] Add recipe image upload to cloud storage
- [ ] Implement caching with Redis
- [ ] Add analytics and tracking endpoints
- [ ] Set up CI/CD pipeline
- [ ] Add API documentation with Swagger/OpenAPI

## 📊 Database Schema

### Collections

#### `recipes`
- Stores all recipes (user-created and AI-generated)
- Indexes: `userId`, `tags`, `cuisine`, `createdAt`, text search on `title` and `description`

#### `savedrecipes`
- Junction table linking users to saved recipes
- Unique compound index on `(userId, recipeId)`
- Includes user notes and ratings

#### `usersettings`
- User preferences and settings
- One-to-one relationship with Firebase users via `userId`

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For Atlas: Whitelist your IP address

### Firebase Authentication Errors
- Verify `serviceAccountKey.json` path is correct
- Ensure Firebase project is set up correctly
- Check that frontend is using the same Firebase project

### Port Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

## 📄 License

ISC

## 👤 Author

Backend Engineer - Recipe Alchemy Nourish Team

---

**Note:** This is an MVP backend. AI recipe generation returns mock data. Integrate with actual AI service for production use.
