const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Attach current user to req.user. Rejects if token missing/invalid. */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const user = await User.findById(payload.sub).select('-password');
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'User not found or inactive' });
  }

  req.user = user;
  next();
}

/**
 * Role guard factory.
 * Usage: requireRole('admin', 'faculty')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, signToken };
