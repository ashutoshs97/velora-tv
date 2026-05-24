import cors from 'cors';

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

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const normalise = (o) => o.replace(/^(https?:\/\/)(www\.)?/, '$1');
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
});
