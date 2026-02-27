// Auth routes - Spotify OAuth 2.0 flow
const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { getCurrentUser } = require('../services/spotify');
const { auth } = require('../middleware/auth');
const { getSetting } = require('../models/Settings');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET;
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const SCOPES = [
  'user-read-recently-played',
  'user-read-currently-playing',
  'user-top-read',
  'user-read-private',
  'user-read-email',
].join(' ');

// Redirect to Spotify for auth
router.get('/spotify', async (req, res) => {
  // Check if registrations are open (admin setting)
  const registrationsOpen = await getSetting('registrations_open', true);
  const userCount = await User.countDocuments();

  // Allow first user (becomes admin), then check setting
  if (userCount > 0 && !registrationsOpen) {
    // Check if this is a re-login (user already exists)
    // We allow re-logins always; block new registrations
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_PUBLIC,
    scope: SCOPES,
    redirect_uri: `${process.env.API_ENDPOINT}/api/auth/spotify/callback`,
    state: Math.random().toString(36).substring(7),
  });

  res.redirect(`${SPOTIFY_AUTH_URL}?${params}`);
});

// Spotify OAuth callback
router.get('/spotify/callback', async (req, res) => {
  const { code, error } = req.query;
  const CLIENT_ENDPOINT = process.env.CLIENT_ENDPOINT;

  if (error) {
    logger.warn(`Spotify OAuth error: ${error}`);
    return res.redirect(`${CLIENT_ENDPOINT}/?error=spotify_auth_failed`);
  }

  try {
    // Exchange code for tokens
    const credentials = Buffer.from(
      `${process.env.SPOTIFY_PUBLIC}:${process.env.SPOTIFY_SECRET}`
    ).toString('base64');

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.API_ENDPOINT}/api/auth/spotify/callback`,
    });

    const { data: tokens } = await axios.post(SPOTIFY_TOKEN_URL, tokenParams, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Get user profile
    const spotifyUser = await getCurrentUser(tokens.access_token);
    const userCount = await User.countDocuments();
    const registrationsOpen = await getSetting('registrations_open', true);

    // Block new registrations if disabled (existing users can still log in)
    const existingUser = await User.findOne({ spotifyId: spotifyUser.id });
    if (!existingUser && userCount > 0 && !registrationsOpen) {
      return res.redirect(`${CLIENT_ENDPOINT}/?error=registrations_closed`);
    }

    // Upsert user
    const user = await User.findOneAndUpdate(
      { spotifyId: spotifyUser.id },
      {
        displayName: spotifyUser.display_name || spotifyUser.id,
        email: spotifyUser.email,
        avatarUrl: spotifyUser.images?.[0]?.url || null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        // First user becomes admin
        ...(userCount === 0 ? { isAdmin: true } : {}),
      },
      { upsert: true, new: true }
    );

    // Issue JWT (7 day)
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`User ${user.displayName} logged in`);
    res.redirect(`${CLIENT_ENDPOINT}/dashboard`);
  } catch (err) {
    logger.error(`OAuth callback error: ${err.message}`);
    res.redirect(`${process.env.CLIENT_ENDPOINT}/?error=auth_failed`);
  }
});

// Get current user
router.get('/me', auth, (req, res) => {
  res.json(req.user.toSafeObject());
});

// Logout
router.post('/logout', auth, (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
