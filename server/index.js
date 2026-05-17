import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import moviesRouter from './routes/movies.js';
import historyRouter from './routes/history.js';
import watchlistRouter from './routes/watchlist.js';
import commentsRouter from './routes/comments.js';
import proxyRouter from './routes/proxy.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

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
    const isLocal =
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://[::1]:');
    const allowed =
      isLocal ||
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

app.use('/api/proxy', proxyRouter);

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

app.use(errorHandler);



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