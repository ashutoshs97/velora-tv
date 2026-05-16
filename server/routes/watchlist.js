import express from 'express';
import { 
  getWatchlist, 
  addWatchlistEntry, 
  deleteWatchlistEntry, 
  clearWatchlist 
} from '../controllers/watchlist.controller.js';

const router = express.Router();

router.get('/', getWatchlist);
router.post('/', addWatchlistEntry);
router.delete('/:id', deleteWatchlistEntry);
router.delete('/', clearWatchlist);

export default router;
