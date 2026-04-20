require('dotenv').config();

const mongoose = require('../config/mongodb');
const UserSchema = require('../models/schemas/userSchema');
const TeamSchema = require('../models/schemas/teamSchema');
const EventSchema = require('../models/schemas/eventSchema');

async function waitForMongoConnection() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for MongoDB connection'));
    }, 10000);

    mongoose.connection.once('connected', () => {
      clearTimeout(timeout);
      resolve();
    });

    mongoose.connection.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function run() {
  await waitForMongoConnection();

  const targets = [
    { label: 'users', model: UserSchema },
    { label: 'teams', model: TeamSchema },
    { label: 'events', model: EventSchema }
  ];

  for (const target of targets) {
    const indexes = await target.model.syncIndexes();
    console.log(`[indexes] ${target.label}: ${indexes.join(', ') || 'no changes'}`);
  }

  console.log('Mongo text indexes are verified.');
}

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Failed to verify Mongo indexes:', err.message);
    try {
      await mongoose.connection.close();
    } catch (_) {
      // ignore close errors
    }
    process.exit(1);
  });
