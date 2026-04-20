require('dotenv').config();

const mongoose = require('mongoose');
const EventSchema = require('../models/schemas/eventSchema');
const TeamSchema = require('../models/schemas/teamSchema');
const UserSchema = require('../models/schemas/userSchema');
const {
  isConfigured
} = require('../config/solr');
const {
  reindexEvents,
  reindexTeams,
  reindexUsers,
  indexSingleEvent,
  indexSingleTeam,
  indexSingleUser,
  deleteSingleEvent,
  deleteSingleTeam,
  deleteSingleUser
} = require('../services/solrIndexService');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';
const WATCH_MODE = process.argv.includes('--watch');
const FULL_REINDEX = process.argv.includes('--full-reindex');

async function connectMongo() {
  await mongoose.connect(MONGO_URI);
  console.log('[SolrSync] Connected to MongoDB');
}

async function runFullReindex() {
  const started = Date.now();
  const [events, teams, users] = await Promise.all([
    reindexEvents({ commit: true }),
    reindexTeams({ commit: true }),
    reindexUsers({ commit: true })
  ]);
  console.log(`[SolrSync] Full reindex complete events=${events} teams=${teams} users=${users} timeMs=${Date.now() - started}`);
}

function watchCollection(model, label, onIndex, onDelete) {
  const stream = model.watch([], { fullDocument: 'updateLookup' });

  stream.on('change', async (change) => {
    try {
      if (change.operationType === 'delete') {
        await onDelete(change.documentKey && change.documentKey._id ? change.documentKey._id : null);
        console.log(`[SolrSync][${label}] deleted id=${change.documentKey?._id || 'unknown'}`);
        return;
      }

      if (['insert', 'replace', 'update'].includes(change.operationType)) {
        if (change.fullDocument) {
          await onIndex(change.fullDocument);
          console.log(`[SolrSync][${label}] upsert id=${change.fullDocument._id}`);
        }
      }
    } catch (err) {
      console.error(`[SolrSync][${label}] sync error: ${err.message}`);
    }
  });

  stream.on('error', (err) => {
    console.error(`[SolrSync][${label}] change stream error: ${err.message}`);
  });

  return stream;
}

async function run() {
  if (!isConfigured()) {
    console.error('[SolrSync] Solr is not configured. Set SOLR_BASE_URL and credentials.');
    process.exit(1);
  }

  await connectMongo();

  if (FULL_REINDEX) {
    await runFullReindex();
  }

  if (!WATCH_MODE) {
    await mongoose.disconnect();
    console.log('[SolrSync] Completed (no watch mode).');
    process.exit(0);
  }

  try {
    const streams = [
      watchCollection(EventSchema, 'events', indexSingleEvent, deleteSingleEvent),
      watchCollection(TeamSchema, 'teams', indexSingleTeam, deleteSingleTeam),
      watchCollection(UserSchema, 'users', indexSingleUser, deleteSingleUser)
    ];

    console.log('[SolrSync] Watch mode enabled. Listening for MongoDB changes...');

    process.on('SIGINT', async () => {
      console.log('\n[SolrSync] Shutting down...');
      await Promise.all(streams.map((stream) => stream.close().catch(() => {})));
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (err) {
    // Change streams require replica set / sharded cluster. Exit with clear guidance.
    console.error(`[SolrSync] Watch mode unavailable: ${err.message}`);
    console.error('[SolrSync] Ensure MongoDB replica set is enabled for real-time sync.');
    await mongoose.disconnect();
    process.exit(1);
  }
}

run().catch(async (err) => {
  console.error('[SolrSync] Fatal error:', err.message);
  try { await mongoose.disconnect(); } catch (_) { }
  process.exit(1);
});
