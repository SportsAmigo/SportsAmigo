require('dotenv').config();

const { reindexEvents, reindexTeams } = require('../services/solrIndexService');

async function run() {
  const startedAt = Date.now();

  try {
    console.log('[Solr] Reindex started');

    const eventCount = await reindexEvents({ commit: true });
    console.log(`[Solr] Reindexed events: ${eventCount}`);

    const teamCount = await reindexTeams({ commit: true });
    console.log(`[Solr] Reindexed teams: ${teamCount}`);

    const elapsedMs = Date.now() - startedAt;
    console.log(`[Solr] Reindex completed in ${elapsedMs}ms`);
    process.exit(0);
  } catch (err) {
    console.error('[Solr] Reindex failed:', err.message);
    process.exit(1);
  }
}

run();
