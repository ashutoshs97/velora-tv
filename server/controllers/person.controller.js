import { tmdbFetch } from '../services/tmdb.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidId, setCacheHeaders } from '../utils/helpers.js';

export const getPerson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid person id' });
  }
  const data = await tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits' });
  setCacheHeaders(res, 3600);
  res.json(data);
});
