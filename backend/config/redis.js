const { Redis } = require("@upstash/redis");

if (process.env.NODE_ENV === 'test') {
    const mockClient = {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 0,
        scan: async () => ['0', []],
        ping: async () => 'PONG',
        on: () => mockClient,
        quit: async () => true,
        disconnect: () => true
    };

    module.exports = mockClient;
} else {
    // Fail fast if Upstash credentials are missing
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.error('[Redis] ERROR: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are strictly required.');
        process.exit(1);
    }

    const redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    // Startup connection verification test since REST clients are stateless
    (async () => {
        try {
            await redisClient.set("startup_test", "working");
            const val = await redisClient.get("startup_test");
            if (val === "working") {
                console.log('[Redis] Upstash successfully connected. Test key verified.');
            }
        } catch (err) {
            console.error('[Redis] Upstash REST connection test failed:', err.message);
        }
    })();

    module.exports = redisClient;
}
