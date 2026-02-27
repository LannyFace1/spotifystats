// User model - stores Spotify OAuth tokens and user preferences
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  email: { type: String },
  avatarUrl: { type: String },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiresAt: { type: Date, required: true },
  isAdmin: { type: Boolean, default: false },
  timezone: { type: String, default: 'UTC' },
  lastPolledAt: { type: Date, default: null },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Never expose tokens
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    spotifyId: this.spotifyId,
    displayName: this.displayName,
    email: this.email,
    avatarUrl: this.avatarUrl,
    isAdmin: this.isAdmin,
    timezone: this.timezone,
    registeredAt: this.registeredAt,
    lastPolledAt: this.lastPolledAt,
  };
};

module.exports = mongoose.model('User', userSchema);
