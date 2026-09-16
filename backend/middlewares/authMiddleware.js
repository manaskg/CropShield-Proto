import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../config/redis.js';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    // Check Redis blacklist
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cropshield_super_secret_jwt_key_2026_secure');
    
    // Attach user information
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.', error: error.message });
  }
};

/**
 * Optional Auth - populates req.user if token is valid, but does not block if not authenticated
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const blacklisted = await isTokenBlacklisted(token);
      if (!blacklisted) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cropshield_super_secret_jwt_key_2026_secure');
        req.user = decoded;
        req.token = token;
      }
    }
  } catch (e) {
    // Ignore error for optional auth
  }
  next();
};
