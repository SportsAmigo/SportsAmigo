const Redis = require('ioredis');

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
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    const redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        // Handle TLS for Upstash (rediss:// URLs)
        ...(redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {})
    });

    redisClient.on('connect', () => {
        console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('ready', () => {
        console.log('[Redis] Ready to accept commands');
    });

    module.exports = redisClient;
}
