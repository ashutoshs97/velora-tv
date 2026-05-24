import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
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

app.use(corsMiddleware);

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