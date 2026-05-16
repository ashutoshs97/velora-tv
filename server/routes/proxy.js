import express from 'express';

const router = express.Router();

// AnyEmbed direct stream proxy
router.get('/anyembed', async (req, res) => {
  const { id, type, s, e } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    const target = type === 'tv'
      ? `https://anyembed.xyz/api/v1/stream/tmdb-tv-${id}-${s}-${e}`
      : `https://anyembed.xyz/api/v1/stream/tmdb-movie-${id}`;
    
    const response = await fetch(target, {
      headers: {
        'Referer': 'https://anyembed.xyz/',
        'Origin': 'https://anyembed.xyz',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `AnyEmbed returned ${response.status}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[ANYEMBED PROXY]', err.message);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

export default router;
