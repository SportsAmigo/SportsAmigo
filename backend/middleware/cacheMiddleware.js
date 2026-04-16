const redisClient = require('../config/redis');

/**
 * Redis cache middleware factory.
 * Returns Express middleware that:
 * - On cache HIT: responds immediately with cached data + X-Cache: HIT header
 * - On cache MISS: intercepts res.json, stores response in Redis, sets X-Cache: MISS
 * - On Redis failure: silently falls through to route handler (graceful degradation)
 *
 * @param {number} ttlSeconds - Cache TTL in seconds (default 60)
 * @returns {Function} Express middleware
 */
function cacheMiddleware(ttlSeconds = 60) {
    return async (req, res, next) => {
        const cacheKey = 'cache:' + req.originalUrl;

        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-TTL', ttlSeconds);
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (err) {
            console.error('[Cache] Redis read error:', err.message);
            // Do not block the request if Redis fails — fall through to next()
        }

        // Intercept res.json to store the response in Redis
        const originalJson = res.json.bind(res);
        res.json = async (data) => {
            res.setHeader('X-Cache', 'MISS');
            try {
                if (res.statusCode === 200) {
                    await redisClient.set(cacheKey, JSON.stringify(data), 'EX', ttlSeconds);
                }
            } catch (err) {
                console.error('[Cache] Redis write error:', err.message);
            }
            return originalJson(data);
        };

        next();
    };
}

module.exports = cacheMiddleware;
