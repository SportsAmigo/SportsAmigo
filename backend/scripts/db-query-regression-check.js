#!/usr/bin/env node
require('dotenv').config();

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Event = require('../models/schemas/eventSchema');
const ShopItem = require('../models/schemas/shopItemSchema');
const Registration = require('../models/schemas/registrationSchema');
const Order = require('../models/schemas/orderSchema');
const Commission = require('../models/schemas/commissionSchema');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

function nowIso() {
  return new Date().toISOString();
}

function summarizeExplain(name, explainResult) {
  const stats = explainResult.executionStats || {};
  const winningPlan = ((explainResult.queryPlanner || {}).winningPlan) || {};
  const stage = winningPlan.stage || (winningPlan.inputStage && winningPlan.inputStage.stage) || 'UNKNOWN';
  const docsExamined = Number(stats.totalDocsExamined || 0);
  const nReturned = Number(stats.nReturned || 0);
  const ratio = nReturned > 0 ? docsExamined / nReturned : docsExamined;

  return {
    name,
    stage,
    docsExamined,
    nReturned,
    ratio: Number(ratio.toFixed(2)),
    executionTimeMillis: Number(stats.executionTimeMillis || 0)
  };
}

function assertQueryHealth(summary) {
  const issues = [];

  if (summary.stage === 'COLLSCAN') {
    issues.push('COLLSCAN detected');
  }

  if (summary.nReturned > 0 && summary.ratio > 50) {
    issues.push(`High docsExamined/nReturned ratio: ${summary.ratio}`);
  }

  return issues;
}

async function seedMinimalData() {
  await Promise.all([Event.init(), ShopItem.init(), Registration.init(), Order.init(), Commission.init()]);

  const userId = new mongoose.Types.ObjectId();
  const organizerId = new mongoose.Types.ObjectId();
  const eventId = new mongoose.Types.ObjectId();
  const teamId = new mongoose.Types.ObjectId();

  await Event.updateOne(
    { _id: eventId },
    {
      $setOnInsert: {
        organizer_id: organizerId,
        title: 'Intercollege Football Cup',
        description: 'A competitive football event for colleges',
        sport_type: 'Football',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        event_time: '10:00',
        location: 'Main Ground',
        status: 'upcoming'
      }
    },
    { upsert: true }
  );

  await ShopItem.updateOne(
    { name: 'Football Jersey Pro' },
    {
      $setOnInsert: {
        name: 'Football Jersey Pro',
        description: 'Premium breathable sports jersey',
        category: 'Apparel',
        price: 1499,
        stock: 25,
        featured: true
      }
    },
    { upsert: true }
  );

  await Registration.updateOne(
    { event_id: eventId, team_id: teamId },
    {
      $setOnInsert: {
        event_id: eventId,
        team_id: teamId,
        registeredAt: new Date()
      }
    },
    { upsert: true }
  );

  await Order.updateOne(
    { orderNumber: 'PERF-ORDER-001' },
    {
      $setOnInsert: {
        orderNumber: 'PERF-ORDER-001',
        userId,
        status: 'confirmed',
        orderDate: new Date(),
        items: [{ itemId: new mongoose.Types.ObjectId(), name: 'Football Jersey Pro', quantity: 1, price: 1499 }],
        totalAmount: 1499,
        shippingAddress: {
          fullName: 'Perf User',
          email: 'perf@example.com',
          phone: '9999999999',
          address: 'Street 1',
          city: 'Chennai',
          state: 'TN',
          zipCode: '600001'
        },
        paymentMethod: 'wallet'
      }
    },
    { upsert: true }
  );

  await Commission.updateOne(
    { event: eventId, organizer: organizerId },
    {
      $setOnInsert: {
        event: eventId,
        organizer: organizerId,
        totalRevenue: 10000,
        commissionAmount: 1500,
        organizerPayout: 8500,
        status: 'pending',
        eligibleForPayoutAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    },
    { upsert: true }
  );
}

async function run() {
  const startedAt = nowIso();
  let memoryMongo = null;
  let connectedUri = MONGO_URI;

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 });
  } catch (primaryErr) {
    console.warn('Primary Mongo connection failed, using mongodb-memory-server fallback.');
    memoryMongo = await MongoMemoryServer.create();
    connectedUri = memoryMongo.getUri('sportsamigo_perf');
    await mongoose.connect(connectedUri, { serverSelectionTimeoutMS: 4000 });
  }

  try {
    await seedMinimalData();

    const queryPlans = [];

    const eventExplain = await Event.find({ status: 'upcoming' }).sort({ event_date: 1 }).limit(20).explain('executionStats');
    queryPlans.push(summarizeExplain('events_by_status_and_date', eventExplain));

    const eventSearchExplain = await Event.find({ $text: { $search: 'football college' } }).limit(20).explain('executionStats');
    queryPlans.push(summarizeExplain('events_text_search', eventSearchExplain));

    const shopFeaturedExplain = await ShopItem.find({ featured: true, stock: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).explain('executionStats');
    queryPlans.push(summarizeExplain('shop_featured_items', shopFeaturedExplain));

    const shopSearchExplain = await ShopItem.find({ $text: { $search: 'sports jersey' } }).limit(20).explain('executionStats');
    queryPlans.push(summarizeExplain('shop_text_search', shopSearchExplain));

    const registrationExec = await Registration.find({}).limit(1).lean();
    const registrationEventId = registrationExec[0] ? registrationExec[0].event_id : new mongoose.Types.ObjectId();
    const registrationPlan = await Registration.find({ event_id: registrationEventId }).limit(20).explain('executionStats');
    queryPlans.push(summarizeExplain('registrations_by_event', registrationPlan));

    const orderExec = await Order.find({}).limit(1).lean();
    const orderUserId = orderExec[0] ? orderExec[0].userId : new mongoose.Types.ObjectId();
    const orderExplain = await Order.find({ userId: orderUserId }).sort({ orderDate: -1 }).limit(20).explain('executionStats');
    queryPlans.push(summarizeExplain('orders_by_user_date', orderExplain));

    const commissionExec = await Commission.find({}).limit(1).lean();
    const commissionOrganizerId = commissionExec[0] ? commissionExec[0].organizer : new mongoose.Types.ObjectId();
    const commissionExplain = await Commission.find({ organizer: commissionOrganizerId, status: 'pending' }).sort({ eligibleForPayoutAt: 1 }).limit(20).explain('executionStats');
    queryPlans.push(summarizeExplain('commissions_by_organizer_status', commissionExplain));

    const issues = queryPlans.flatMap((plan) =>
      assertQueryHealth(plan).map((issue) => `${plan.name}: ${issue}`)
    );

    const report = {
      generatedAt: nowIso(),
      startedAt,
      mongoUriMasked: connectedUri.replace(/:[^:@/]+@/, ':***@'),
      queryPlans,
      issues,
      passed: issues.length === 0
    };

    const fs = require('fs');
    const path = require('path');
    const outDir = path.join(__dirname, '..', '..', 'docs', 'perf');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'db-query-plan-latest.json'), JSON.stringify(report, null, 2));

    const markdown = [
      '# DB Query Regression Report',
      '',
      `Generated at: ${report.generatedAt}`,
      '',
      '| Query | Stage | Docs Examined | Returned | Ratio | Time (ms) |',
      '|---|---|---:|---:|---:|---:|',
      ...queryPlans.map((p) => `| ${p.name} | ${p.stage} | ${p.docsExamined} | ${p.nReturned} | ${p.ratio} | ${p.executionTimeMillis} |`),
      '',
      issues.length ? '## Issues\n\n' + issues.map((i) => `- ${i}`).join('\n') : '## Issues\n\nNone',
      ''
    ].join('\n');

    fs.writeFileSync(path.join(outDir, 'db-query-plan-latest.md'), markdown);

    if (issues.length > 0) {
      console.error('DB query regression check failed:\n' + issues.join('\n'));
      process.exitCode = 1;
    } else {
      console.log('DB query regression check passed.');
    }
  } finally {
    await mongoose.disconnect();
    if (memoryMongo) {
      await memoryMongo.stop();
    }
  }
}

run().catch((err) => {
  console.error('DB query regression script failed:', err);
  process.exit(1);
});
