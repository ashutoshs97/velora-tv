import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import moviesRouter from './routes/movies.js';
import historyRouter from './routes/history.js';
import watchlistRouter from './routes/watchlist.js';
import commentsRouter from './routes/comments.js';

const app = express();
const PORT = process.env.PORT || 5000;

const PRODUCTION_ORIGINS = [
  'https://veloratv.in',
  'https://www.veloratv.in',
  'https://velora-tv-3os2.vercel.app',
];

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

console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const normalise = (o) => o.replace(/^(https?:\/\/)www\./, '$1');
    const normOrigin = normalise(origin);
    const allowed =
      allowedOrigins.includes('*') ||
      allowedOrigins.some(o => normalise(o) === normOrigin);
    if (allowed) return callback(null, true);
    console.error('[CORS] Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

app.use('/api/movies', moviesRouter);
app.use('/api/history', historyRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/comments', commentsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Velora API is running',
    dbConnected: mongoose.connection.readyState === 1,
    uptime: Math.floor(process.uptime()),
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.path, '-', err.message);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
      });
      console.log('[DB] Connected to MongoDB');
      return true;
    } catch (err) {
      console.error(`[DB] Connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log('[DB] Retrying in 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  return false;
};

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB error:', err.message);
});

const startServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.log('[DB] Starting without database — history features disabled');
  }
  app.listen(PORT, () => {
    console.log(`[SERVER] Velora running on http://localhost:${PORT}`);
  });
};

startServer();