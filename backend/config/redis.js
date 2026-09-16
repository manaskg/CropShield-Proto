import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;
const memoryCache = new Map();

try {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) return null;
        return 1000;
      }
    });

    redisClient.connect().then(() => {
      console.log('[Redis Cloud] Connected successfully');
    }).catch((err) => {
      console.warn(`[Redis] Cloud Offline (${err.message}). Using resilient in-memory cache.`);
      redisClient = null;
    });
  }
} catch (e) {
  console.warn('[Redis] Initialization skipped. Using memory cache.');
  redisClient = null;
}

/**
 * Blacklist a JWT token (used on logout)
 */
export const blacklistToken = async (token, expiryInSeconds = 3600 * 24 * 7) => {
  if (redisClient && redisClient.status === 'ready') {
    try {
      await redisClient.set(`blacklist:${token}`, 'true', 'EX', expiryInSeconds);
      return true;
    } catch (e) {
      console.error('[Redis] Error setting blacklist:', e);
    }
  }
  memoryCache.set(`blacklist:${token}`, { val: 'true', expiry: Date.now() + (expiryInSeconds * 1000) });
  return true;
};

/**
 * Check if a JWT token is blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  if (redisClient && redisClient.status === 'ready') {
    try {
      const result = await redisClient.get(`blacklist:${token}`);
      return result === 'true';
    } catch (e) {
      console.error('[Redis] Error checking blacklist:', e);
    }
  }
  const item = memoryCache.get(`blacklist:${token}`);
  if (!item) return false;
  if (Date.now() > item.expiry) {
    memoryCache.delete(`blacklist:${token}`);
    return false;
  }
  return true;
};

/**
 * Generic Cache GET
 */
export const getCache = async (key) => {
  if (redisClient && redisClient.status === 'ready') {
    try {
      const data = await redisClient.get(`cache:${key}`);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[Redis] Cache get error:', e.message);
    }
  }
  const item = memoryCache.get(`cache:${key}`);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(`cache:${key}`);
    return null;
  }
  return item.val;
};

/**
 * Generic Cache SET with TTL
 */
export const setCache = async (key, val, expiryInSeconds = 3600 * 24) => {
  const serialized = JSON.stringify(val);
  if (redisClient && redisClient.status === 'ready') {
    try {
      await redisClient.set(`cache:${key}`, serialized, 'EX', expiryInSeconds);
      return true;
    } catch (e) {
      console.warn('[Redis] Cache set error:', e.message);
    }
  }
  memoryCache.set(`cache:${key}`, { val, expiry: Date.now() + (expiryInSeconds * 1000) });
  return true;
};

export default redisClient;

