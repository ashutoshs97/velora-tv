import express from 'express';
import mongoose from 'mongoose';
import Watchlist from '../models/Watchlist.js';

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

// GET /api/watchlist — fetch all watchlist items
router.get('/', async (req, res) => {
  if (!isDbConnected()) {
    return res.json([]);
  }

  try {
    const watchlist = await Watchlist.find()
      .sort({ addedAt: -1 })
      .lean();

    res.json(watchlist);
  } catch (err) {
    console.error('Watchlist GET error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to fetch watchlist') });
  }
});

// POST /api/watchlist — add or update watchlist entry
router.post('/', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Database not available' });
  }

  const { error, data } = sanitizeEntry(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const entry = await Watchlist.findOneAndUpdate(
      { tmdbId: data.tmdbId },
      { ...data, addedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json(entry);
  } catch (err) {
    console.error('Watchlist POST error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to save watchlist entry') });
  }
});

// DELETE /api/watchlist/:id — remove a single entry
router.delete('/:id', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Database not available' });
  }

  const { id } = req.params;
  // If id is a number, assume it's tmdbId, otherwise ObjectId
  const isTmdbId = !isNaN(id);
  
  if (!isTmdbId && !isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid watchlist item ID' });
  }

  try {
    const deleted = isTmdbId
      ? await Watchlist.findOneAndDelete({ tmdbId: Number(id) })
      : await Watchlist.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    res.json({ success: true, deletedTmdbId: deleted.tmdbId });
  } catch (err) {
    console.error('Watchlist DELETE error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to delete watchlist item') });
  }
});

// DELETE /api/watchlist — clear all watchlist
router.delete('/', async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Database not available' });
  }

  try {
    await Watchlist.deleteMany({});
    res.json({ success: true, message: 'Watchlist cleared' });
  } catch (err) {
    console.error('Watchlist CLEAR error:', err.message);
    res.status(500).json({ error: clientError(err, 'Failed to clear watchlist') });
  }
});

export default router;
