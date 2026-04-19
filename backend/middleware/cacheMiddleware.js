const redisClient = require('../config/redis');

/**
 * Redis cache middleware factory.
 *
 * Cache key format: cache:<userId>:<originalUrl>
 *   - Scoped per-user so different users never share each other's responses.
 *   - 'anon' is used for unauthenticated routes (e.g. public shop listings).
 *
 * Response headers set:
 *   X-Cache-Status : HIT | MISS   (visible cross-origin via CORS exposedHeaders)
 *   X-Cache-TTL    : <ttlSeconds>
 *
 * Graceful degradation: any Redis error falls through to the real route handler.
 *
 * @param {number} ttlSeconds - Cache TTL in seconds (default 60)
 * @returns {Function} Express middleware
 */
function cacheMiddleware(ttlSeconds = 60) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') return next();

        // Allow cache bypass via query param or header
        if (req.query.nocache === '1' || req.get('cache-control') === 'no-cache') {
            return next();
        }

        // Scope cache key to the authenticated user so different users
        // never receive each other's data from cache.
        const userId = req.session?.user?._id?.toString() || 'anon';
        const cacheKey = `cache:${userId}:${req.originalUrl}`;

        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                res.setHeader('X-Cache-Status', 'HIT');
                res.setHeader('X-Cache-TTL', ttlSeconds);
                return res.status(200).json(
                    typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData
                );
            }
        } catch (err) {
            console.error('[Cache] Redis read error:', err.message);
            // Do not block the request if Redis fails — fall through
        }

        // Intercept res.json to store the successful response in Redis
        const originalJson = res.json.bind(res);
        res.json = async (data) => {
            res.setHeader('X-Cache-Status', 'MISS');
            res.setHeader('X-Cache-TTL', ttlSeconds);
            try {
                if (res.statusCode === 200) {
                    await redisClient.set(cacheKey, JSON.stringify(data), { ex: ttlSeconds });
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
