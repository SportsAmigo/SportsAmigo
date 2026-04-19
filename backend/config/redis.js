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
    // In development/local, fall back to mock if credentials missing
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn('[Redis] WARNING: UPSTASH credentials not set - running with no-op cache (dev mode).');
        const mockClient = {
            get: async () => null,
            set: async () => 'OK',
            del: async () => 0,
            scan: async () => ['0', []],
            ping: async () => 'PONG',
            on: function () { return this; },
            quit: async () => true,
            disconnect: () => true
        };
        module.exports = mockClient;
    } else {

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
}
