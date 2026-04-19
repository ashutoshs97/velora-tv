import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    mediaId: {
      type: String,
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      required: true,
      enum: ['movie', 'tv', 'anime'],
    },
    author: {
      type: String,
      default: 'Anonymous',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Comment', commentSchema);
