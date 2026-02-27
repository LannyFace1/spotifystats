// History routes - paginated listening history
const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Track = require('../models/Track');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const [tracks, total] = await Promise.all([
      Track.find({ userId: req.user._id })
        .sort({ playedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Track.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      tracks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
