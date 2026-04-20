import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    posterPath: { type: String },
    backdropPath: { type: String },
    year: { type: String },
    rating: { type: Number },
    overview: { type: String },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure we don't duplicate entries
watchlistSchema.index({ tmdbId: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;
