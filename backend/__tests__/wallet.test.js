const request = require('supertest');
const { connectTestDB, disconnectTestDB, clearCollections } = require('./helpers/testServer');

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

// Helper: create a player user and return logged-in agent
async function createPlayerAgent() {
    const User = require('../models/user');
    const UserSchema = require('../models/schemas/userSchema');
    
    await User.createUser({
        email: 'player@test.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'Player',
        role: 'player'
    });

    // Ensure walletBalance field exists
    await UserSchema.findOneAndUpdate(
        { email: 'player@test.com' },
        { $set: { walletBalance: 0, walletStatus: 'Active' } }
    );

    const agent = request.agent(app);
    await agent
        .post('/api/auth/login')
        .send({ email: 'player@test.com', password: 'TestPass123!' });
    return agent;
}

describe('GET /api/wallet/balance', () => {
    test('returns 200 and current balance for authenticated player', async () => {
        const agent = await createPlayerAgent();
        
        const res = await agent.get('/api/wallet/balance');
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(typeof res.body.balance).toBe('number');
        expect(res.body.balance).toBe(0);
    });

    test('returns 401 for unauthenticated request', async () => {
        const res = await request(app).get('/api/wallet/balance');
        
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

describe('POST /api/wallet/add (credit)', () => {
    test('valid credit increases balance', async () => {
        const agent = await createPlayerAgent();
        
        const res = await agent
            .post('/api/wallet/add')
            .send({ amount: 500 });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.newBalance).toBe(500);

        // Verify balance via GET
        const balRes = await agent.get('/api/wallet/balance');
        expect(balRes.body.balance).toBe(500);
    });

    test('credit with negative amount returns error', async () => {
        const agent = await createPlayerAgent();
        
        const res = await agent
            .post('/api/wallet/add')
            .send({ amount: -100 });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });

    test('credit with zero amount returns error', async () => {
        const agent = await createPlayerAgent();
        
        const res = await agent
            .post('/api/wallet/add')
            .send({ amount: 0 });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });

    test('credit exceeding max amount returns error', async () => {
        const agent = await createPlayerAgent();
        
        const res = await agent
            .post('/api/wallet/add')
            .send({ amount: 100000 });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });
});

describe('GET /api/wallet/transactions', () => {
    test('returns transaction list after credits', async () => {
        const agent = await createPlayerAgent();
        
        // Perform multiple credits
        await agent.post('/api/wallet/add').send({ amount: 100 });
        await agent.post('/api/wallet/add').send({ amount: 200 });
        await agent.post('/api/wallet/add').send({ amount: 300 });
        
        const res = await agent.get('/api/wallet/transactions');
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.transactions.length).toBeGreaterThanOrEqual(3);
    });
});
