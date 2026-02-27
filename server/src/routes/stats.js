// Stats routes - aggregated listening statistics
const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Track = require('../models/Track');
const { z } = require('zod');

const rangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '180d', '1y', 'all']).default('30d'),
});

function getDateRange(range) {
  const now = new Date();
  const map = {
    '7d': 7, '30d': 30, '90d': 90, '180d': 180, '1y': 365,
  };
  if (range === 'all') return null;
  const days = map[range] || 30;
  return new Date(now - days * 24 * 60 * 60 * 1000);
}

function baseMatch(userId, since) {
  const match = { userId };
  if (since) match.playedAt = { $gte: since };
  return match;
}

// Overview stats
router.get('/overview', auth, async (req, res) => {
  try {
    const { range } = rangeSchema.parse(req.query);
    const since = getDateRange(range);
    const match = baseMatch(req.user._id, since);

    const [totals] = await Track.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTracks: { $sum: 1 },
          totalMs: { $sum: '$durationMs' },
          uniqueTracks: { $addToSet: '$spotifyTrackId' },
          uniqueArtists: { $addToSet: '$artistId' },
          uniqueAlbums: { $addToSet: '$albumId' },
        },
      },
      {
        $project: {
          totalTracks: 1,
          totalMs: 1,
          uniqueTracks: { $size: '$uniqueTracks' },
          uniqueArtists: { $size: '$uniqueArtists' },
          uniqueAlbums: { $size: '$uniqueAlbums' },
        },
      },
    ]);

    res.json(totals || {
      totalTracks: 0, totalMs: 0, uniqueTracks: 0, uniqueArtists: 0, uniqueAlbums: 0,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Top tracks
router.get('/top-tracks', auth, async (req, res) => {
  try {
    const { range } = rangeSchema.parse(req.query);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const since = getDateRange(range);
    const match = baseMatch(req.user._id, since);

    const tracks = await Track.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$spotifyTrackId',
          count: { $sum: 1 },
          totalMs: { $sum: '$durationMs' },
          trackName: { $first: '$trackName' },
          artistName: { $first: '$artistName' },
          artistNames: { $first: '$artistNames' },
          albumName: { $first: '$albumName' },
          albumImage: { $first: '$albumImage' },
          externalUrl: { $first: '$externalUrl' },
          lastPlayed: { $max: '$playedAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    res.json(tracks);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Top artists
router.get('/top-artists', auth, async (req, res) => {
  try {
    const { range } = rangeSchema.parse(req.query);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const since = getDateRange(range);
    const match = baseMatch(req.user._id, since);

    const artists = await Track.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$artistId',
          count: { $sum: 1 },
          totalMs: { $sum: '$durationMs' },
          artistName: { $first: '$artistName' },
          genres: { $first: '$genres' },
          uniqueTracks: { $addToSet: '$spotifyTrackId' },
        },
      },
      {
        $project: {
          count: 1, totalMs: 1, artistName: 1, genres: 1,
          uniqueTracks: { $size: '$uniqueTracks' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    res.json(artists);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Top albums
router.get('/top-albums', auth, async (req, res) => {
  try {
    const { range } = rangeSchema.parse(req.query);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const since = getDateRange(range);
    const match = baseMatch(req.user._id, since);

    const albums = await Track.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$albumId',
          count: { $sum: 1 },
          totalMs: { $sum: '$durationMs' },
          albumName: { $first: '$albumName' },
          albumImage: { $first: '$albumImage' },
          artistName: { $first: '$artistName' },
          uniqueTracks: { $addToSet: '$spotifyTrackId' },
        },
      },
      {
        $project: {
          count: 1, totalMs: 1, albumName: 1, albumImage: 1, artistName: 1,
          uniqueTracks: { $size: '$uniqueTracks' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    res.json(albums);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listening over time (daily/weekly buckets)
router.get('/timeline', auth, async (req, res) => {
  try {
    const { range } = rangeSchema.parse(req.query);
    const since = getDateRange(range);
    const match = baseMatch(req.user._id, since);

    const groupByDay = range === '7d' || range === '30d';

    const timeline = await Track.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupByDay
            ? {
                year: { $year: '$playedAt' },
                month: { $month: '$playedAt' },
                day: { $dayOfMonth: '$playedAt' },
              }
            : {
                year: { $year: '$playedAt' },
                week: { $week: '$playedAt' },
              },
          count: { $sum: 1 },
          totalMs: { $sum: '$durationMs' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    res.json(timeline);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listening by hour of day (heatmap data)
router.get('/heatmap', auth, async (req, res) => {
  try {
    const { range } = rangeSchema.parse(req.query);
    const since = getDateRange(range);
    const match = baseMatch(req.user._id, since);

    const heatmap = await Track.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            hour: { $hour: '$playedAt' },
            dayOfWeek: { $dayOfWeek: '$playedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
    ]);

    res.json(heatmap);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Top genres
router.get('/top-genres', auth, async (req, res) => {
  try {
    const { range } = rangeSchema.parse(req.query);
    const since = getDateRange(range);
    const match = baseMatch(req.user._id, since);

    const genres = await Track.aggregate([
      { $match: { ...match, genres: { $exists: true, $ne: [] } } },
      { $unwind: '$genres' },
      {
        $group: {
          _id: '$genres',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json(genres);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
