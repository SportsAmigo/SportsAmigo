require('dotenv').config();

const mongoose = require('mongoose');

const { reindexEvents, reindexTeams, reindexUsers } = require('../services/solrIndexService');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

async function run() {
  const startedAt = Date.now();

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Solr] Reindex started');

    const eventCount = await reindexEvents({ commit: true });
    console.log(`[Solr] Reindexed events: ${eventCount}`);

    const teamCount = await reindexTeams({ commit: true });
    console.log(`[Solr] Reindexed teams: ${teamCount}`);

    const userCount = await reindexUsers({ commit: true });
    console.log(`[Solr] Reindexed users: ${userCount}`);

    const elapsedMs = Date.now() - startedAt;
    console.log(`[Solr] Reindex completed in ${elapsedMs}ms`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Solr] Reindex failed:', err.message);
    try { await mongoose.disconnect(); } catch (_) { }
    process.exit(1);
  }
}

run();
