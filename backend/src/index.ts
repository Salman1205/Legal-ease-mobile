import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config.js';

import { authRouter } from './api/auth.js';
import { chatRouter } from './api/chat.js';
import { documentRouter } from './api/document.js';
import { contractRouter } from './api/contract.js';
import { lawyersRouter } from './api/lawyers.js';
import { educationRouter } from './api/education.js';
import { transcribeRouter } from './api/transcribe.js';
import { errorHandler } from './middleware/auth.js';
import { dataService } from './services/data.js';

const app: Express = express();
const PORT = process.env.SERVER_PORT || 3001;

// Validate critical environment variables
const validateEnvironment = () => {
  const requiredVars = ['GROQ_API_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('⚠️  Set these in Vercel Environment Variables for production');
  }
  
  if (process.env.GROQ_API_KEY) {
    console.log('✓ GROQ_API_KEY is configured');
  } else {
    console.error('✗ GROQ_API_KEY is NOT configured - chat will fail');
  }
};

validateEnvironment();

dataService.loadAll();

// CORS
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
  'https://legal-mobile-frontend.vercel.app',
];

const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isExactAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = /^https:\/\/.*\.vercel\.app$/.test(origin);

    if (isExactAllowed || isVercelPreview) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
    message: 'Too many requests, please try again later',
  });
  app.use('/api/', limiter);
}

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'LegalEase API - TypeScript/Node.js Backend',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      document: '/api/document',
      contract: '/api/contract',
      lawyers: '/api/lawyers',
      education: '/api/education',
      transcribe: '/api/transcribe',
    },
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/document', documentRouter);
app.use('/api/contract', contractRouter);
app.use('/api/lawyers', lawyersRouter);
app.use('/api/education', educationRouter);
app.use('/api/transcribe', transcribeRouter);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start server (only in dev/prod)
if (process.env.NODE_ENV !== 'vercel') {
  app.listen(PORT, () => {
    console.log(`\n🚀 LegalEase Backend running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
  });
}

export default app;
