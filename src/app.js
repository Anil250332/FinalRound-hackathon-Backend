import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  ENV.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => origin === allowed || allowed === '*')) {
        return callback(null, true);
      }
      // Allow any vercel.app domain for ease of deployment
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for hackathon demo
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (PRD requirement)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'PulseRelay API',
    timestamp: new Date().toISOString(),
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'PulseRelay API',
    version: '1.1.0',
    description: 'Emergency Inter-Hospital Blood Coordination Network API',
    healthCheck: '/health',
    apiRoot: '/api/v1',
  });
});

// Mount API v1 router
app.use('/api/v1', apiRouter);

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
