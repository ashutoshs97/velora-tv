import express from 'express';
import WatchHistory from '../models/WatchHistory.js';

const router = express.Router();

// GET /api/history — fetch last 20 watched
router.get('/', async (req, res) => {
  try {
    const history = await WatchHistory.find()
      .sort({ watchedAt: -1 })
      .limit(20);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/history — add or update watch entry
router.post('/', async (req, res) => {
  const { tmdbId, title, posterPath, backdropPath, year, rating, overview } = req.body;
  if (!tmdbId || !title) {
    return res.status(400).json({ error: 'tmdbId and title are required' });
  }
  try {
    const entry = await WatchHistory.findOneAndUpdate(
      { tmdbId },
      { tmdbId, title, posterPath, backdropPath, year, rating, overview, watchedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/:id — remove a single entry
router.delete('/:id', async (req, res) => {
  try {
    await WatchHistory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history — clear all history
router.delete('/', async (req, res) => {
  try {
    await WatchHistory.deleteMany({});
    res.json({ success: true, message: 'Watch history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
