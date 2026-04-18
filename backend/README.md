# LegalEase Backend - TypeScript/Node.js

A high-performance backend for the LegalEase AI-powered legal assistant, built with Express.js and TypeScript. Deployed on Vercel with serverless functions.

## 🚀 Features

- **Authentication**: JWT-based user registration and login
- **AI Chat**: Integration with Groq LLM for legal analysis
- **Document Processing**: Extract text from PDF, DOCX, images (OCR)
- **Contract Analysis**: Automated contract review and risk assessment
- **Lawyer Connect**: Lawyer profiles, ratings, and reviews
- **Education Module**: Courses, MCQs, assessments, and law library
- **Legal Search**: Vector-based legal document search (ready for Supabase pgvector)
- **Rate Limiting**: Built-in rate limiting for API protection
- **CORS**: Configured for mobile and web clients

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Groq API Key** (get from https://console.groq.com)
- Optional: **Supabase** account (for production database and vector search)

## 🛠️ Installation

1. **Clone the repository and navigate to backend**
```bash
cd legal-mobile/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file** (copy from `.env.example`)
```bash
cp .env.example .env
```

4. **Update `.env` with your keys**
```env
# Server
SERVER_PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=30d

# Groq LLM
GROQ_API_KEY=gsk_YOUR_API_KEY_HERE

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
```

## 🏃 Development

**Start the development server:**
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 📦 API Endpoints

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/session           # Check session
```

### Chat & Documents
```
POST   /api/chat                   # Send chat message (with optional document context)
POST   /api/document/extract       # Extract text from document
POST   /api/contract/analyze       # Analyze contract
```

### Lawyers
```
GET    /api/lawyers                # Get all lawyers
GET    /api/lawyers/:id            # Get lawyer details
GET    /api/lawyers/:id/reviews    # Get lawyer reviews
POST   /api/lawyers/:id/reviews    # Add review for lawyer
GET    /api/lawyers/search/:query  # Search lawyers
```

### Education
```
GET    /api/education/courses      # Get all courses
GET    /api/education/courses/:id  # Get course details
POST   /api/education/assessments/:courseId/:userId  # Submit assessment
GET    /api/education/progress/:userId/:courseId    # Get progress
```

### Health
```
GET    /                           # API info
GET    /health                     # Health check
```

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

## 📝 Request Examples

**Chat with AI:**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the contract act?",
    "conversation_history": [],
    "document_context": null
  }'
```

**Upload and extract document:**
```bash
curl -X POST http://localhost:3001/api/document/extract \
  -F "file=@contract.pdf"
```

**Analyze contract:**
```bash
curl -X POST http://localhost:3001/api/contract/analyze \
  -F "file=@agreement.docx"
```

## 🚀 Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Push to GitHub** (Vercel integrates with GitHub)

3. **Deploy**
```bash
vercel
```

4. **Set environment variables in Vercel dashboard**:
   - Go to Vercel → Project Settings → Environment Variables
   - Add: `JWT_SECRET`, `GROQ_API_KEY`, etc.

5. **Update mobile app URL:**
   In `src/constants/api.js`:
   ```javascript
   const API_BASE_URL = 'https://your-project.vercel.app';
   ```

## 🗄️ Database Setup (Optional - Supabase)

For production with persistent data:

1. Create Supabase project at https://supabase.com
2. Create tables: users, sessions, lawyers, courses, assessments, etc.
3. Update `.env` with Supabase credentials
4. Use `supabase-js` client in services

Database schema files coming soon in `/migrations`

## 📊 Project Structure

```
backend/
├── src/
│   ├── api/              # API route handlers
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── chat.ts       # Chat endpoint
│   │   ├── document.ts   # Document extraction
│   │   ├── contract.ts   # Contract analysis
│   │   ├── lawyers.ts    # Lawyer profiles
│   │   └── education.ts  # Education module
│   ├── services/         # Business logic
│   │   ├── auth.ts       # Auth helpers (JWT, passwords)
│   │   ├── llm.ts        # Groq integration
│   │   ├── document.ts   # Document processing
│   │   └── search.ts     # Legal search
│   ├── middleware/       # Express middleware
│   │   └── auth.ts       # JWT verification
│   ├── types/            # TypeScript interfaces
│   │   └── index.ts      # All type definitions
│   └── index.ts          # Main Express app
├── api/
│   └── [...slug].ts      # Vercel serverless handler
├── dist/                 # Compiled JavaScript
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vercel.json           # Vercel config
└── .env.example          # Environment template
```

## 🔄 Migration from Python Backend

**This backend is a complete TypeScript port of the Python FastAPI backend with:**
- ✅ Same API endpoints and responses
- ✅ Same authentication mechanism
- ✅ Same chat and document processing
- ✅ Same lawyer and education data structure
- ✅ Ready for Vercel deployment

**Differences:**
- JWT tokens instead of session tokens
- Supabase-ready (instead of ChromaDB for vector search)
- Serverless functions for Vercel
- No external file storage needed

## 🌐 Mobile App Integration

The mobile app (`legal-mobile/src/services/api.js`) is pre-configured to:
- Detect platform (Android, iOS, Web)
- Use correct localhost IP (10.0.2.2 for Android emulator)
- Support both dev and production URLs
- Handle authentication automatically

Just update the Vercel URL in `src/constants/api.js` when deploying!

## 🧪 Testing

```bash
# Coming soon: Unit tests with Jest
npm run test

# Coming soon: Integration tests
npm run test:integration
```

## 📚 API Documentation

Full interactive API documentation coming soon at `/api-docs` (Swagger UI setup in progress)

## 🐛 Troubleshooting

**Port already in use**
```bash
# Change port in .env
SERVER_PORT=3002
```

**CORS errors**
```bash
# Update CORS_ORIGIN in .env to include your client domain
CORS_ORIGIN=http://localhost:3000,http://localhost:8081,https://yourdomain.com
```

**Document extraction fails**
```bash
# Ensure Tesseract is installed globally (for OCR)
# On Windows: Install from https://github.com/UB-Mannheim/tesseract/wiki
```

## 📞 Support

For issues or questions:
1. Check the `.env.example` for required variables
2. Ensure Groq API key is valid
3. Check console logs for detailed error messages
4. Review API documentation above

## 📄 License

MIT

## 🙏 Credits

Built as a TypeScript port of LegalEase Python FastAPI backend for Vercel deployment compatibility.

---

**Ready to deploy?** Run `vercel` to get your backend live! 🚀
