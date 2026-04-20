const request = require('supertest');
const { connectTestDB, disconnectTestDB } = require('./helpers/testServer');

let app;

beforeAll(async () => {
    await connectTestDB();
    app = require('../server');
});

afterAll(async () => {
    await disconnectTestDB();
});

describe('GET /health', () => {
    test('returns 200 with status ok', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.timestamp).toBeDefined();
        expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
        expect(typeof res.body.uptime).toBe('number');
    });
});
