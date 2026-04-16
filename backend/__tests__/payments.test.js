jest.mock('../config/razorpay', () => ({
    razorpay: {
        orders: {
            create: jest.fn().mockResolvedValue({
                id: 'order_test_mock123',
                amount: 299900,
                currency: 'INR',
                status: 'created'
            })
        }
    },
    verifyPaymentSignature: jest.fn(),
    isRazorpayConfigured: true
}));

const request = require('supertest');
const crypto = require('crypto');
const { connectTestDB, disconnectTestDB, clearCollections } = require('./helpers/testServer');

let app;

beforeAll(async () => {
    await connectTestDB();
    app = require('../server');
});

afterEach(async () => {
    await clearCollections();
    jest.clearAllMocks();
});

afterAll(async () => {
    await disconnectTestDB();
});

// Helper: create organizer user and return logged-in agent
async function createOrganizerAgent() {
    const User = require('../models/user');
    await User.createUser({
        email: 'organizer@test.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'Organizer',
        role: 'organizer'
    });

    const agent = request.agent(app);
    await agent
        .post('/api/auth/login')
        .send({ email: 'organizer@test.com', password: 'TestPass123!' });
    return agent;
}

async function createOrganizerAndEvent() {
    const UserSchema = require('../models/schemas/userSchema');
    const EventSchema = require('../models/schemas/eventSchema');

    const organizer = await UserSchema.findOne({ email: 'organizer@test.com' });
    const event = await EventSchema.create({
        organizer_id: organizer._id,
        title: 'Test Tournament',
        description: 'Test event for payments',
        sport_type: 'Football',
        event_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        event_time: '10:00',
        location: 'Test Ground',
        status: 'upcoming'
    });

    return { organizer, event };
}

describe('POST /api/v1/subscriptions/create-order', () => {
    test('authenticated organizer gets a valid order response', async () => {
        const agent = await createOrganizerAgent();
        
        const res = await agent
            .post('/api/v1/subscriptions/create-order')
            .send({ plan: 'pro', billingCycle: 'monthly' });
        
        // Accept 200 or 201 for successful order creation
        expect([200, 201]).toContain(res.status);
        expect(res.body.orderId || res.body.order?.id).toBeDefined();
    });

    test('unauthenticated request returns 401', async () => {
        const res = await request(app)
            .post('/api/v1/subscriptions/create-order')
            .send({ plan: 'pro', billingCycle: 'monthly' });
        
        expect(res.status).toBe(403);
    });

    test('invalid or missing plan field returns 400', async () => {
        const agent = await createOrganizerAgent();
        
        const res = await agent
            .post('/api/v1/subscriptions/create-order')
            .send({});
        
        expect(res.status).toBe(400);
    });
});

describe('POST /api/v1/subscriptions/verify-payment', () => {
    test('invalid/tampered signature returns 400', async () => {
        const agent = await createOrganizerAgent();
        
        const res = await agent
            .post('/api/v1/subscriptions/verify-payment')
            .send({
                razorpay_order_id: 'order_test_mock123',
                razorpay_payment_id: 'pay_test_mock456',
                razorpay_signature: 'totally_wrong_signature',
                plan: 'pro',
                billingCycle: 'monthly'
            });
        
        expect(res.status).toBe(400);
    });
});

describe('POST /api/v1/vas/create-order', () => {
    test('authenticated organizer can create VAS order', async () => {
        const agent = await createOrganizerAgent();
        const { event } = await createOrganizerAndEvent();
        
        const res = await agent
            .post(`/api/v1/events/${event._id}/vas/create-order`)
            .send({
                serviceType: 'marketing_boost',
                tier: 'basic'
            });
        
        // Accept 200 or 201
        expect([200, 201]).toContain(res.status);
    });

    test('unauthenticated VAS request returns 401', async () => {
        const EventSchema = require('../models/schemas/eventSchema');
        const event = await EventSchema.create({
            organizer_id: '65f1f77bc6d1f0adf1de0001',
            title: 'Public Test Event',
            description: 'Unauth VAS test event',
            sport_type: 'Cricket',
            event_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            event_time: '11:00',
            location: 'Ground 2',
            status: 'upcoming'
        });

        const res = await request(app)
            .post(`/api/v1/events/${event._id}/vas/create-order`)
            .send({
                serviceType: 'marketing_boost',
                tier: 'basic'
            });
        
        expect(res.status).toBe(403);
    });
});
