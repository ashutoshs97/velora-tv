import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    posterPath: { type: String },
    backdropPath: { type: String },
    year: { type: String },
    rating: { type: Number },
    overview: { type: String },
    watchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure we don't duplicate entries — update watchedAt if re-watched
watchHistorySchema.index({ tmdbId: 1 }, { unique: true });

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);
export default WatchHistory;
