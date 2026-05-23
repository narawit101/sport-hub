const Redis = require("ioredis");

let redis = null;
let isConnected = false;
let cacheDisabled = false;

function disableRedis(reason) {
  if (reason) {
    console.warn(`[Cache] ${reason}`);
  }

  isConnected = false;
  cacheDisabled = true;

  if (redis) {
    redis.disconnect();
  }

  redis = null;
}

/**
 * Initialize Redis connection (Upstash compatible)
 * Falls back gracefully if Redis is unavailable
 */
function initRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[Cache] REDIS_URL not set - caching disabled");
    cacheDisabled = true;
    return null;
  }

  try {
    const parsedUrl = new URL(redisUrl);
    const isSecure = parsedUrl.protocol === "rediss:";

    if (!["redis:", "rediss:"].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
      disableRedis("Invalid REDIS_URL - caching disabled");
      return null;
    }

    redis = new Redis(parsedUrl.toString(), {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 1) return null;
        return Math.min(times * 200, 2000);
      },
      tls: isSecure ? {} : undefined,
    });

    redis.on("connect", () => {
      isConnected = true;
      cacheDisabled = false;
      console.log("[Cache] Redis connected");
    });

    redis.on("error", (err) => {
      isConnected = false;
      console.warn("[Cache] Redis error:", err.message);

      if (err.code === "ENOTFOUND" || err.code === "ENETUNREACH") {
        disableRedis(
          "Disabling Redis cache because the Redis host could not be reached. Check REDIS_URL on the deployment platform."
        );
      }
    });

    redis.on("close", () => {
      isConnected = false;
    });

    redis.connect().catch((err) => {
      disableRedis(`Failed to connect to Redis - caching disabled (${err.message})`);
    });

    return redis;
  } catch (err) {
    disableRedis(`Failed to init Redis - caching disabled (${err.message})`);
    return null;
  }
}

/**
 * Get cached value by key
 * @param {string} key
 * @returns {any|null} parsed JSON or null
 */
async function getCache(key) {
  if (!redis || !isConnected || cacheDisabled) return null;
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
  if (!redis || !isConnected || cacheDisabled) return;
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
  if (!redis || !isConnected || cacheDisabled) return;
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
  if (!redis || !isConnected || cacheDisabled) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn("[Cache] Pattern DEL error:", err.message);
  }
}

initRedis();

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  invalidatePattern,
};
