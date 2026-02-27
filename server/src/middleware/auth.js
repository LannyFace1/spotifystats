// Auth middleware - validates JWT from cookie or Authorization header
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

module.exports = { auth, adminAuth };
