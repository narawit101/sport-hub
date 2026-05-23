const Redis = require("ioredis");

let redis = null;
let isConnected = false;

/**
 * Initialize Redis connection (Upstash compatible)
 * Falls back gracefully if Redis is unavailable
 */
function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[Cache] REDIS_URL not set — caching disabled");
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
    });

    redis.on("connect", () => {
      isConnected = true;
      console.log("[Cache] Redis connected");
    });

    redis.on("error", (err) => {
      isConnected = false;
      console.warn("[Cache] Redis error:", err.message);
    });

    redis.on("close", () => {
      isConnected = false;
    });

    return redis;
  } catch (err) {
    console.warn("[Cache] Failed to init Redis:", err.message);
    return null;
  }
}

/**
 * Get cached value by key
 * @param {string} key
 * @returns {any|null} parsed JSON or null
 */
async function getCache(key) {
  if (!redis || !isConnected) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn("[Cache] GET error:", err.message);
    return null;
  }
}

/**
 * Set cache with TTL
 * @param {string} key
 * @param {any} value - will be JSON.stringify'd
 * @param {number} ttlSeconds - time to live in seconds
 */
async function setCache(key, value, ttlSeconds = 300) {
  if (!redis || !isConnected) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.warn("[Cache] SET error:", err.message);
  }
}

/**
 * Delete specific cache key(s)
 * @param  {...string} keys
 */
async function invalidateCache(...keys) {
  if (!redis || !isConnected) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn("[Cache] DEL error:", err.message);
  }
}

/**
 * Delete cache keys matching a pattern (use sparingly)
 * @param {string} pattern - e.g. "posts:*"
 */
async function invalidatePattern(pattern) {
  if (!redis || !isConnected) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn("[Cache] Pattern DEL error:", err.message);
  }
}

// Initialize on require
initRedis();

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  invalidatePattern,
};
