const request = require('supertest');
const { connectTestDB, disconnectTestDB, clearCollections } = require('./helpers/testServer');

// Must require app AFTER setting up test env
let app;

beforeAll(async () => {
    await connectTestDB();
    app = require('../server');
});

afterEach(async () => {
    await clearCollections();
});

afterAll(async () => {
    await disconnectTestDB();
});

// Helper: create user directly via model
async function createTestUser(overrides = {}) {
    const User = require('../models/user');
    const defaults = {
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'player'
    };
    return User.createUser({ ...defaults, ...overrides });
}

// Helper: login and return agent with session cookie
async function loginAgent(email = 'test@example.com', password = 'TestPass123!') {
    const agent = request.agent(app);
    await agent
        .post('/api/auth/login')
        .send({ email, password });
    return agent;
}

describe('POST /api/auth/login', () => {
    test('correct credentials return 200 and set cookie', async () => {
        await createTestUser();

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'TestPass123!' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.headers['set-cookie']).toBeDefined();
    });

    test('wrong password returns 401', async () => {
        await createTestUser();

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'WrongPassword!' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('non-existent email returns 401', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'anything' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('missing required field returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com' });
        // Missing password
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('password is not leaked in response', async () => {
        await createTestUser();

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'TestPass123!' });

        expect(res.status).toBe(200);
        expect(res.body.user.password).toBeUndefined();
    });
});

describe('GET /api/auth/check-session (protected route)', () => {
    test('accessing without login returns authenticated: false', async () => {
        const res = await request(app)
            .get('/api/auth/check-session');

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(false);
    });

    test('accessing with valid session returns authenticated: true', async () => {
        await createTestUser();
        const agent = await loginAgent();

        const res = await agent
            .get('/api/auth/check-session');

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(true);
        expect(res.body.user.email).toBe('test@example.com');
    });
});

describe('POST /api/auth/logout', () => {
    test('logout destroys session', async () => {
        await createTestUser();
        const agent = await loginAgent();

        // Verify logged in
        let res = await agent.get('/api/auth/check-session');
        expect(res.body.authenticated).toBe(true);

        // Logout
        res = await agent.post('/api/auth/logout');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify session destroyed
        res = await agent.get('/api/auth/check-session');
        expect(res.body.authenticated).toBe(false);
    });
});
