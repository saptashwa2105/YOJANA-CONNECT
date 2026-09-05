# Yojana Connect - Unified Backend & AI Service

Complete backend API and RAG-powered AI chat service for **Yojana Connect**, a government scheme discovery platform built with Node.js, Express, Sequelize, SQLite, and Google Gemini AI.

## Project Structure

```
origin_backend_A/
├── config/
│   └── database.js            # Sequelize SQLite configuration
├── controllers/
│   ├── aiChatController.js    # Local RAG AI chat controller (Zod validation & Gemini RAG)
│   ├── bookmarkController.js  # Controller for managing user bookmarks (:schemeId)
│   ├── chatController.js      # Legacy proxy fallback controller
│   ├── profileController.js   # Controller for active user profile (GET/PUT)
│   ├── recommendationController.js # Rule-based matching engine
│   ├── schemeController.js    # Scheme discovery, search & querying
│   └── userController.js      # Controller for user profile management
├── data/
│   ├── index/
│   │   └── schemes.index.json # Vector embeddings index for schemes
│   └── schemes/               # Comprehensive government scheme JSON datasets
├── models/
│   ├── Bookmark.js            # Bookmark model
│   ├── Scheme.js              # Scheme model
│   ├── User.js                # User / Profile model
│   └── index.js               # Model relationships and Sequelize exports
├── routes/
│   ├── bookmarkRoutes.js      # Routes for /api/bookmarks
│   ├── chatRoutes.js          # Routes for /api/chat (local AI RAG logic)
│   ├── index.js               # Aggregated router (/api)
│   ├── profileRoutes.js       # Routes for /api/profile
│   ├── recommendationRoutes.js# Routes for /api/recommendations
│   ├── schemeRoutes.js        # Routes for /api/schemes (including /search)
│   └── userRoutes.js          # Routes for /api/users
├── scripts/
│   └── ingest.js              # Ingestion script to embed and index scheme documents
├── services/
│   └── ai/                    # Modular AI & RAG service layer
│       ├── chatService.js     # RAG pipeline orchestrator
│       ├── chunker.js         # Scheme document chunker
│       ├── gemini.js          # Google Gemini client (embeddings & generation with retries)
│       ├── language.js        # Language resolver (English, Hindi, Hinglish)
│       └── vectorStore.js     # Cosine similarity vector search
├── utils/
│   └── userResolver.js        # Helper to resolve active user from headers/query/DB
├── .env                       # Environment configuration
├── .env.example               # Template environment configuration
├── database.sqlite            # SQLite database file
├── package.json               # Project manifest, dependencies, and scripts
├── seed.js                    # Database seed script with 13 realistic schemes
└── server.js                  # Application entry point on Port 5001
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Environment variables:
- `PORT`: Server port (default: `5001`)
- `DB_STORAGE`: SQLite file path (default: `./database.sqlite`)
- `GEMINI_API_KEY`: Google Gemini API Key
- `GEMINI_MODEL`: Generative model (default: `gemini-3.7-flash` or `gemini-3.6-flash`)
- `EMBEDDING_MODEL`: Text embedding model (default: `gemini-embedding-001`)

### 3. Seed Database & Re-index Schemes
```bash
npm run db:seed
npm run ingest   # Optional: re-indexes schemes from data/schemes/*.json
```

### 4. Start Unified Server
Development mode (live reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Everything runs unified on **Port 5001**.

---

## API Endpoints

### AI Chat Service (Local RAG)
- `POST /api/chat` - Queries the AI RAG engine over indexed government schemes.
  - **Request Body**:
    ```json
    {
      "message": "What are the financial benefits of PM-KISAN?",
      "language": "en",
      "schemeId": "pm-kisan",
      "profile": {
        "age": 35,
        "state": "Uttar Pradesh",
        "occupation": "Farmer"
      },
      "conversation": [
        { "role": "user", "content": "Hello" }
      ]
    }
    ```
  - **Success Response**:
    ```json
    {
      "answer": "Under the PM-KISAN scheme, eligible landholding farmer families receive financial income support of Rs. 6,000 per year...",
      "language": "en",
      "sources": [
        {
          "schemeId": "pm-kisan",
          "title": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
          "url": "https://www.pmkisan.gov.in/",
          "section": "Benefits"
        }
      ],
      "schemes": ["pm-kisan"],
      "fallback": false
    }
    ```
  - **Error Responses**:
    - `400`: Invalid request / missing message (`{ "error": "Invalid request", "details": [...] }`)
    - `404`: Unknown `schemeId` (`{ "error": "Unknown schemeId" }`)
    - `502`: AI service / Gemini rate limit fallback (`{ "error": "The AI service is temporarily unavailable. Please try again.", "fallback": true }`)

### Health Check
- `GET /api/health` - Server health status and timestamp

### Profile APIs
- `GET /api/profile` - Get the current user's profile, including bookmarked scheme IDs.
- `PUT /api/profile` - Update user profile (`age`, `state`, `occupation`, `language`).

### Recommendations (Rule-Based Matching Engine)
- `GET /api/recommendations` - Scores and ranks schemes based on user occupation, state, and age.

### Scheme Search & Discovery
- `GET /api/schemes/search?q=query` - Full-text search across scheme names, descriptions, categories, and IDs.
- `GET /api/schemes` - List all schemes (supports filters).
- `GET /api/schemes/:id` - Get single scheme details by ID/slug.

### Bookmarks
- `GET /api/bookmarks` - Retrieve all bookmarked schemes for the active user.
- `POST /api/bookmarks/:schemeId` - Bookmark a scheme by its `schemeId` slug.
- `DELETE /api/bookmarks/:schemeId` - Remove a bookmark by `schemeId` or bookmark ID.
