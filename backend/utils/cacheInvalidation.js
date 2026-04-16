const redisClient = require('../config/redis');

async function deleteByPattern(pattern) {
  let cursor = '0';
  let deleted = 0;

  do {
    const reply = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    cursor = reply[0];
    const keys = reply[1] || [];

    if (keys.length > 0) {
      deleted += await redisClient.del(keys);
    }
  } while (cursor !== '0');

  return deleted;
}

async function invalidateCacheByPrefixes(prefixes = []) {
  if (!Array.isArray(prefixes) || prefixes.length === 0) {
    return 0;
  }

  try {
    const tasks = prefixes
      .filter(Boolean)
      .map((prefix) => `cache:${prefix}*`)
      .map((pattern) => deleteByPattern(pattern));

    const results = await Promise.all(tasks);
    return results.reduce((sum, count) => sum + count, 0);
  } catch (err) {
    console.error('[Cache] Invalidation error:', err.message);
    return 0;
  }
}

module.exports = {
  invalidateCacheByPrefixes
};
