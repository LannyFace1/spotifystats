// Spotify API service - handles token refresh and all Spotify API calls
const axios = require('axios');
const logger = require('./logger');

const SPOTIFY_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH = 'https://accounts.spotify.com/api/token';

async function refreshAccessToken(user) {
  const User = require('../models/User');
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    });
    const credentials = Buffer.from(
      `${process.env.SPOTIFY_PUBLIC}:${process.env.SPOTIFY_SECRET}`
    ).toString('base64');

    const { data } = await axios.post(SPOTIFY_AUTH, params, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    user.accessToken = data.access_token;
    user.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    if (data.refresh_token) user.refreshToken = data.refresh_token;
    await user.save();
    logger.info(`Refreshed token for user ${user.spotifyId}`);
    return user.accessToken;
  } catch (err) {
    logger.error(`Token refresh failed for ${user.spotifyId}: ${err.message}`);
    throw err;
  }
}

async function getValidToken(user) {
  if (new Date() >= new Date(user.tokenExpiresAt - 60000)) {
    return refreshAccessToken(user);
  }
  return user.accessToken;
}

async function spotifyGet(user, endpoint, params = {}) {
  const token = await getValidToken(user);
  const { data } = await axios.get(`${SPOTIFY_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return data;
}

async function getRecentlyPlayed(user, limit = 50, after = null) {
  const params = { limit };
  if (after) params.after = after;
  return spotifyGet(user, '/me/recently-played', params);
}

async function getArtistDetails(user, artistId) {
  return spotifyGet(user, `/artists/${artistId}`);
}

async function getCurrentUser(accessToken) {
  const { data } = await axios.get(`${SPOTIFY_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

module.exports = { refreshAccessToken, getValidToken, spotifyGet, getRecentlyPlayed, getArtistDetails, getCurrentUser };
