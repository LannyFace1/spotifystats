// Background poller - fetches recently played tracks for all users every 3 minutes
const cron = require('node-cron');
const logger = require('./logger');
const { getRecentlyPlayed, getArtistDetails } = require('./spotify');
const User = require('../models/User');
const Track = require('../models/Track');

const artistCache = new Map(); // in-memory genre cache

async function fetchGenres(user, artistId) {
  if (artistCache.has(artistId)) return artistCache.get(artistId);
  try {
    const artist = await getArtistDetails(user, artistId);
    const genres = artist.genres || [];
    artistCache.set(artistId, genres);
    // Limit cache size
    if (artistCache.size > 1000) {
      const firstKey = artistCache.keys().next().value;
      artistCache.delete(firstKey);
    }
    return genres;
  } catch {
    return [];
  }
}

async function pollUser(user) {
  try {
    const after = user.lastPolledAt
      ? user.lastPolledAt.getTime()
      : Date.now() - 24 * 60 * 60 * 1000; // last 24h on first run

    const data = await getRecentlyPlayed(user, 50, after);
    const items = data.items || [];

    if (items.length === 0) return;

    let saved = 0;
    for (const item of items) {
      const track = item.track;
      if (!track) continue;

      const primaryArtist = track.artists?.[0];
      const genres = primaryArtist
        ? await fetchGenres(user, primaryArtist.id)
        : [];

      try {
        await Track.create({
          userId: user._id,
          spotifyTrackId: track.id,
          playedAt: new Date(item.played_at),
          trackName: track.name,
          trackUri: track.uri,
          durationMs: track.duration_ms || 0,
          popularity: track.popularity || 0,
          previewUrl: track.preview_url || null,
          externalUrl: track.external_urls?.spotify || null,
          artistId: primaryArtist?.id || null,
          artistName: primaryArtist?.name || null,
          artistNames: track.artists?.map(a => a.name) || [],
          albumId: track.album?.id || null,
          albumName: track.album?.name || null,
          albumImage: track.album?.images?.[0]?.url || null,
          albumReleaseDate: track.album?.release_date || null,
          albumType: track.album?.album_type || null,
          genres,
        });
        saved++;
      } catch (err) {
        if (err.code === 11000) { /* duplicate, skip */ }
        else logger.error(`Track insert error: ${err.message}`);
      }
    }

    user.lastPolledAt = new Date();
    await user.save();

    if (saved > 0) logger.info(`Saved ${saved} tracks for ${user.displayName}`);
  } catch (err) {
    logger.error(`Polling failed for ${user.displayName}: ${err.message}`);
  }
}

async function pollAllUsers() {
  const users = await User.find({});
  logger.info(`Polling ${users.length} user(s)...`);
  await Promise.allSettled(users.map(pollUser));
}

function startPolling() {
  // Poll every 3 minutes
  cron.schedule('*/3 * * * *', async () => {
    try {
      await pollAllUsers();
    } catch (err) {
      logger.error(`Poll cycle error: ${err.message}`);
    }
  });
  // Initial poll on startup
  setTimeout(pollAllUsers, 5000);
  logger.info('Background polling started (every 3 minutes)');
}

module.exports = { startPolling, pollUser };
