// User & admin settings routes
const router = require('express').Router();
const { z } = require('zod');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Track = require('../models/Track');
const { getSetting, setSetting } = require('../models/Settings');
const { pollUser } = require('../services/poller');

// Update current user settings
router.patch('/settings', auth, async (req, res) => {
  try {
    const schema = z.object({
      timezone: z.string().optional(),
    });
    const data = schema.parse(req.body);
    Object.assign(req.user, data);
    await req.user.save();
    res.json(req.user.toSafeObject());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Force re-sync (manual poll)
router.post('/resync', auth, async (req, res) => {
  try {
    await pollUser(req.user);
    res.json({ message: 'Resync complete' });
  } catch (err) {
    res.status(500).json({ error: 'Resync failed' });
  }
});

// Get global settings
router.get('/global-settings', auth, async (req, res) => {
  const registrationsOpen = await getSetting('registrations_open', true);
  res.json({ registrationsOpen });
});

// Admin: list users
router.get('/all', adminAuth, async (req, res) => {
  const users = await User.find({}).select('-accessToken -refreshToken');
  res.json(users.map(u => u.toSafeObject()));
});

// Admin: toggle registrations
router.post('/registrations', adminAuth, async (req, res) => {
  try {
    const { open } = z.object({ open: z.boolean() }).parse(req.body);
    await setSetting('registrations_open', open);
    res.json({ registrationsOpen: open });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: delete user and their data
router.delete('/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await Track.deleteMany({ userId: user._id });
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
