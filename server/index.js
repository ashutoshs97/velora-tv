import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import moviesRouter from './routes/movies.js';
import historyRouter from './routes/history.js';
import animeRouter from './routes/anime.js';
import commentsRouter from './routes/comments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Hard-coded production origins (always allowed regardless of env vars)
const PRODUCTION_ORIGINS = [
  'https://veloratv.in',
  'https://www.veloratv.in',
  'https://velora-tv-3os2.vercel.app',
];

// Support comma-separated ALLOWED_ORIGINS env var for extra origins
const extraOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = [
  ...PRODUCTION_ORIGINS,
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  ...extraOrigins,
].filter(Boolean);

console.log('✅ Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, health checks, same-origin SSR)
    if (!origin) return callback(null, true);

    // Normalise: strip www. so veloratv.in covers www.veloratv.in too
    const normalise = (o) => o.replace(/^(https?:\/\/)www\./, '$1');
    const normOrigin = normalise(origin);

    const allowed =
      allowedOrigins.includes('*') ||
      allowedOrigins.some(o => normalise(o) === normOrigin);

    if (allowed) return callback(null, true);

    console.error(`🚫 CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/movies', moviesRouter);
app.use('/api/history', historyRouter);
app.use('/api/anime', animeRouter);
app.use('/api/comments', commentsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Velora API is running' });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🎬 Velora server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Starting server without DB (history features disabled)');
    app.listen(PORT, () => {
      console.log(`🎬 Velora server running on http://localhost:${PORT}`);
    });
  });
