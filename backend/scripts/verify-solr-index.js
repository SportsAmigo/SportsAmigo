require('dotenv').config();

const {
  solrConfig,
  isConfigured,
  solrPing,
  solrSchemaFields,
  solrSampleDocs
} = require('../config/solr');

const REQUIRED_FIELDS = {
  events: ['id', 'title', 'description', 'location', 'sport_type', 'status', 'event_date'],
  teams: ['id', 'name', 'description', 'sport_type', 'status'],
  users: ['id', 'first_name', 'last_name', 'email', 'role', 'status']
};

async function inspectCollection(label, collection) {
  try {
    const [ping, schema, sample] = await Promise.all([
      solrPing(collection),
      solrSchemaFields(collection),
      solrSampleDocs(collection, 1)
    ]);

    const numFound = Number(ping?.response?.numFound || 0);
    const fields = (schema?.fields || []).map((field) => field.name);
    const sampleDoc = (sample?.response?.docs || [])[0] || null;
    const missingRequiredFields = (REQUIRED_FIELDS[label] || []).filter((name) => !fields.includes(name));

    console.log(`\n[Solr][${label}] collection=${collection}`);
    console.log(`indexedDocs=${numFound}`);
    console.log(`schemaFieldCount=${fields.length}`);
    console.log(`missingRequiredFields=${missingRequiredFields.length ? missingRequiredFields.join(', ') : 'none'}`);

    if (sampleDoc) {
      console.log(`sampleDoc.id=${sampleDoc.id}`);
      console.log(`sampleDoc.keys=${Object.keys(sampleDoc).join(', ')}`);
    } else {
      console.log('sampleDoc=none');
    }

    return {
      ok: missingRequiredFields.length === 0,
      numFound,
      missingRequiredFields
    };
  } catch (err) {
    console.error(`[Solr][${label}] verification failed: ${err.message}`);
    return { ok: false, numFound: 0, missingRequiredFields: ['<verification-error>'] };
  }
}

async function run() {
  if (!isConfigured()) {
    console.error('[Solr] Not configured. Set SOLR_BASE_URL and credentials.');
    process.exit(1);
  }

  const checks = await Promise.all([
    inspectCollection('events', solrConfig.eventCollection),
    inspectCollection('teams', solrConfig.teamCollection),
    inspectCollection('users', solrConfig.userCollection || 'users')
  ]);

  const hasFailures = checks.some((check) => !check.ok);
  if (hasFailures) {
    console.error('\n[Solr] Verification completed with failures.');
    process.exit(1);
  }

  console.log('\n[Solr] Verification completed successfully.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[Solr] Fatal verify error:', err.message);
  process.exit(1);
});
