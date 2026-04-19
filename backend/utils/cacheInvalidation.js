const redisClient = require('../config/redis');

/**
 * Deletes all Redis keys matching the given glob pattern.
 * Uses SCAN to avoid blocking the server on large key sets.
 *
 * @param {string} pattern - Redis glob pattern (e.g. 'cache:userId:/api/organizer/events*')
 * @returns {number} Count of deleted keys
 */
async function deleteByPattern(pattern) {
    let cursor = '0';
    let deleted = 0;

    do {
        const [nextCursor, keys] = await redisClient.scan(cursor, { match: pattern, count: 200 });
        cursor = nextCursor;

        if (keys && keys.length > 0) {
            deleted += await redisClient.del(...keys);
        }
    } while (cursor !== '0');

    return deleted;
}

/**
 * Invalidate cached responses for the given URL prefixes.
 *
 * @param {string[]} prefixes  - Array of URL prefixes to invalidate (e.g. ['/api/organizer/stats'])
 * @param {string}   [userId]  - Optional. If provided, only that user's cache is cleared.
 *                               If omitted, ALL users' cache for those prefixes is cleared.
 * @returns {number} Total keys deleted
 */
async function invalidateCacheByPrefixes(prefixes = [], userId = null) {
    if (!Array.isArray(prefixes) || prefixes.length === 0) return 0;

    try {
        // Build glob patterns:
        //   With userId  → cache:<userId>:/api/organizer/stats*
        //   Without      → cache:*:/api/organizer/stats*   (all users)
        const userSegment = userId ? String(userId) : '*';

        const tasks = prefixes
            .filter(Boolean)
            .map((prefix) => `cache:${userSegment}:${prefix}*`)
            .map((pattern) => deleteByPattern(pattern));

        const results = await Promise.all(tasks);
        const total = results.reduce((sum, count) => sum + count, 0);
        if (total > 0) {
            console.log(`[Cache] Invalidated ${total} key(s) for prefixes: ${prefixes.join(', ')} (user: ${userSegment})`);
        }
        return total;
    } catch (err) {
        console.error('[Cache] Invalidation error:', err.message);
        return 0;
    }
}

module.exports = { invalidateCacheByPrefixes };
