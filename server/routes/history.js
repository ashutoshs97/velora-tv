import express from 'express';
import mongoose from 'mongoose';
import WatchHistory from '../models/WatchHistory.js';

const router = express.Router();
const IS_PROD = process.env.NODE_ENV === 'production';

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function clientError(err, fallback) {
  return IS_PROD ? fallback : err.message;
}

function sanitizeEntry(body) {
  const {
    tmdbId,
    title,
    posterPath,
    backdropPath,
    year,
    rating,
    overview,
    type,
  } = body;

  const safeTmdbId = Number(tmdbId);
  if (!safeTmdbId || safeTmdbId <= 0 || !Number.isInteger(safeTmdbId)) {
    return { error: 'tmdbId must be a positive integer' };
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    return { error: 'title is required' };
  }

  return {
    data: {
      tmdbId: safeTmdbId,
      title: title.trim().substring(0, 200),
      posterPath: typeof posterPath === 'string' ? posterPath : undefined,
      backdropPath: typeof backdropPath === 'string' ? backdropPath : undefined,
      year: year ? String(year).substring(0, 4) : undefined,
      rating:
        rating !== undefined ? Math.min(10, Math.max(0, Number(rating) || 0)) : undefined,
      overview: typeof overview === 'string' ? overview.substring(0, 1000) : undefined,
      type: type === 'tv' ? 'tv' : 'movie',
    },
  };
}

// GET /api/history — fetch last 20 watched
router.get('/', async (req, res) => {
  if (!isDbConnected()) {
    return res.json([]);
  }

  try {
    const history = await WatchHistory.find()
      .sort({ watchedAt: -1 })
      .limit(20)
      .lean();

    res.json(history);
  } catch (err) {
    console.error('History GET error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to fetch history') });
  }
});

// POST /api/history — add or update watch entry
router.post('/', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Database not available' });
  }

  const { error, data } = sanitizeEntry(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const entry = await WatchHistory.findOneAndUpdate(
      { tmdbId: data.tmdbId },
      { ...data, watchedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json(entry);
  } catch (err) {
    console.error('History POST error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to save history entry') });
  }
});

// DELETE /api/history/:id — remove a single entry
router.delete('/:id', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Database not available' });
  }

  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid history item ID' });
  }

  try {
    const deleted = await WatchHistory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'History item not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('History DELETE error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to delete history item') });
  }
});

// DELETE /api/history — clear all history
router.delete('/', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    await WatchHistory.deleteMany({});
    res.json({ success: true, message: 'Watch history cleared' });
  } catch (err) {
    console.error('History CLEAR error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to clear history') });
  }
});

export default router;