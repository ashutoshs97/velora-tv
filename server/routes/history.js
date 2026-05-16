import express from 'express';
import { 
  getHistory, 
  addHistoryEntry, 
  deleteHistoryEntry, 
  clearHistory 
} from '../controllers/history.controller.js';

const router = express.Router();

router.get('/', getHistory);
router.post('/', addHistoryEntry);
router.delete('/:id', deleteHistoryEntry);
router.delete('/', clearHistory);

export default router;