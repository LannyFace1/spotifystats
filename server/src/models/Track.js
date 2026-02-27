// Track model - stores each listened track with full metadata
const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  spotifyTrackId: { type: String, required: true },
  playedAt: { type: Date, required: true, index: true },

  // Track info
  trackName: { type: String, required: true },
  trackUri: { type: String },
  durationMs: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
  previewUrl: { type: String },
  externalUrl: { type: String },

  // Artist info (primary)
  artistId: { type: String },
  artistName: { type: String },
  artistNames: [{ type: String }], // all artists
  artistImages: [{ url: String }],

  // Album info
  albumId: { type: String },
  albumName: { type: String },
  albumImage: { type: String },
  albumReleaseDate: { type: String },
  albumType: { type: String },

  // Genres (from artist)
  genres: [{ type: String }],
}, { timestamps: false });

// Compound index to prevent duplicates
trackSchema.index({ userId: 1, spotifyTrackId: 1, playedAt: 1 }, { unique: true });
trackSchema.index({ userId: 1, playedAt: -1 });

module.exports = mongoose.model('Track', trackSchema);
