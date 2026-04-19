import express from 'express';
import Comment from '../models/Comment.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET/:mediaType/:mediaId
 * Fetch comments for a specific media item.
 */
router.get('/:mediaType/:mediaId', async (req, res) => {
  try {
    const { mediaType, mediaId } = req.params;

    // Check if the database is actually connected before querying
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const comments = await Comment.find({ mediaType, mediaId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /
 * Create a new anonymous comment.
 */
router.post('/', async (req, res) => {
  try {
    const { mediaType, mediaId, content } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    if (!mediaType || !mediaId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment is too long' });
    }

    const newComment = new Comment({
      mediaType,
      mediaId,
      content,
      author: 'Anonymous',
    });

    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    console.error('Error saving comment:', error);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

export default router;
