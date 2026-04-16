/**
 * Keep-alive utility for Render free tier.
 * Pings the backend /health endpoint every 10 minutes to prevent
 * the server from spinning down due to inactivity.
 * Only active in production when RENDER_EXTERNAL_URL is set.
 */
const https = require('https');
const http = require('http');

function startKeepAlive() {
    const backendUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
    if (!backendUrl || process.env.NODE_ENV !== 'production') {
        console.log('[KeepAlive] Disabled — not in production or no URL set');
        return;
    }

    const pingUrl = backendUrl.replace(/\/$/, '') + '/health';
    const client = pingUrl.startsWith('https') ? https : http;
    console.log(`[KeepAlive] Starting — will ping ${pingUrl} every 10 minutes`);

    setInterval(() => {
        client.get(pingUrl, (res) => {
            console.log(`[KeepAlive] Ping sent — status ${res.statusCode}`);
        }).on('error', (err) => {
            console.error('[KeepAlive] Ping failed:', err.message);
        });
    }, 10 * 60 * 1000); // every 10 minutes
}

module.exports = { startKeepAlive };
