const EventSchema = require('../models/schemas/eventSchema');
const TeamSchema = require('../models/schemas/teamSchema');
const UserSchema = require('../models/schemas/userSchema');
const { solrConfig, isConfigured, solrQuery } = require('../config/solr');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function escLucene(value) {
  return String(value || '').replace(/([+\-!(){}\[\]^"~*?:\\/]|&&|\|\|)/g, '\\$1');
}

function normalizePaging(page, limit) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const start = (normalizedPage - 1) * normalizedLimit;
  return { page: normalizedPage, limit: normalizedLimit, start };
}

function buildEdismaxQuery(searchText) {
  const raw = String(searchText || '').trim();
  if (!raw) {
    return '*:*';
  }

  const tokens = raw
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => escLucene(token));

  if (tokens.length === 0) return '*:*';

  // Prefix + fuzzy terms improves partial matching while preserving eDisMax relevance.
  return tokens
    .map((token) => `${token}* ${token}~1`)
    .join(' ');
}

function buildBaseMeta({ engine, collection, fallbackReason, elapsedMs, strategy }) {
  return {
    engine,
    provider: engine === 'solr' ? 'SearchStax-Solr' : 'MongoDB-Fallback',
    collection,
    elapsedMs,
    fallbackReason: fallbackReason || null,
    strategy: strategy || null
  };
}

function buildResultPayload({ results, page, limit, total, searchMeta }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    success: true,
    results,
    data: results,
    total,
    page,
    limit,
    totalPages,
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    searchMeta
  };
}

function logSearch(collection, search, page, limit, engine, total, elapsedMs, fallbackReason) {
  const base = `[Search][${collection}] q="${search}" page=${page} limit=${limit} engine=${engine} total=${total} time=${elapsedMs}ms`;
  if (fallbackReason) {
    console.warn(`${base} fallbackReason="${fallbackReason}"`);
    return;
  }
  console.info(base);
}

function mapUserResult(doc = {}) {
  const firstName = doc.first_name || '';
  const lastName = doc.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const role = doc.role || 'user';

  return {
    _id: String(doc._id || doc.id || ''),
    id: String(doc._id || doc.id || ''),
    name: fullName || doc.email || 'Unnamed User',
    first_name: firstName,
    last_name: lastName,
    email: doc.email || '',
    role,
    phone: doc.phone || '',
    profile_image: doc.profile_image || '',
    status: doc.status || 'Active',
    verificationStatus: doc.verificationStatus || doc.verification_status || null,
    tier: doc.organizerTier || null
  };
}

function mapTeamResult(doc = {}) {
  const id = String(doc._id || doc.id || '');
  const createdAt = doc.created_at || doc.createdAt || null;
  const members = Array.isArray(doc.members) ? doc.members.length : Number(doc.current_members || 0);

  return {
    ...doc,
    _id: id,
    id,
    name: doc.name || '',
    description: doc.description || '',
    sport_type: doc.sport_type || '',
    manager_name: doc.manager_name || 'N/A',
    current_members: members,
    createdAt
  };
}

function mapEventResult(doc = {}) {
  const id = String(doc._id || doc.id || '');
  return {
    ...doc,
    _id: id,
    id,
    title: doc.title || doc.name || '',
    name: doc.name || doc.title || '',
    description: doc.description || '',
    sport_type: doc.sport_type || '',
    organizer_name: doc.organizer_name || 'N/A',
    event_date: doc.event_date || null,
    location: doc.location || '',
    status: doc.status || 'pending_approval'
  };
}

async function runSolrSearch({ collection, search, page, limit, qf, pf, fq = [] }) {
  const q = buildEdismaxQuery(search);
  return solrQuery(collection, {
    q,
    wt: 'json',
    defType: 'edismax',
    qf,
    pf,
    mm: '2<75%',
    ps: 2,
    tie: 0.1,
    'q.op': 'AND',
    sow: true,
    lowercaseOperators: true,
    start: (page - 1) * limit,
    rows: limit,
    ...(fq.length ? { fq } : {})
  });
}

function buildRegexSearch(search) {
  const q = String(search || '').trim();
  if (!q) return null;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

function isMissingTextIndexError(err) {
  if (!err) return false;
  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('text index required')
    || message.includes('index required for $text query')
  );
}

async function searchEvents({ search = '', page = 1, limit = DEFAULT_LIMIT, statuses = [] } = {}) {
  const started = Date.now();
  const paging = normalizePaging(page, limit);
  const normalizedStatuses = Array.isArray(statuses)
    ? statuses.filter(Boolean)
    : [];

  let fallbackReason = null;

  if (solrConfig.enabled && isConfigured()) {
    try {
      const fq = normalizedStatuses.map((status) => `status:${escLucene(status)}`);
      const result = await runSolrSearch({
        collection: solrConfig.eventCollection,
        search,
        page: paging.page,
        limit: paging.limit,
        qf: 'title^8 description^3 location^4 sport_type^6 status^2',
        pf: 'title^12 location^6 sport_type^8',
        fq
      });

      const docs = (result?.response?.docs || []).map(mapEventResult);
      const total = Number(result?.response?.numFound || 0);
      const elapsedMs = Date.now() - started;
      const payload = buildResultPayload({
        results: docs,
        page: paging.page,
        limit: paging.limit,
        total,
        searchMeta: buildBaseMeta({ engine: 'solr', collection: 'events', elapsedMs, strategy: 'edismax' })
      });
      logSearch('events', search, paging.page, paging.limit, 'solr', total, elapsedMs);
      return payload;
    } catch (err) {
      fallbackReason = err.message;
    }
  }

  const normalizedSearch = String(search || '').trim();
  const mongoQuery = {};
  let mongoStrategy = 'none';
  let docs = [];
  let total = 0;

  if (normalizedStatuses.length > 0) {
    mongoQuery.status = { $in: normalizedStatuses };
  }

  if (normalizedSearch) {
    const textQuery = { ...mongoQuery, $text: { $search: normalizedSearch } };
    try {
      [docs, total] = await Promise.all([
        EventSchema.find(textQuery, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, event_date: -1, created_at: -1 })
          .skip(paging.start)
          .limit(paging.limit)
          .lean(),
        EventSchema.countDocuments(textQuery)
      ]);
      mongoStrategy = 'text-index';
      // $text only matches whole words; fall to regex for partial terms like "Vish" -> "Vishal"
      if (docs.length === 0) throw new Error('text-index:empty');
    } catch (textErr) {
      if (!fallbackReason && textErr.message !== 'text-index:empty') {
        fallbackReason = textErr.message;
      }

      const regex = buildRegexSearch(normalizedSearch);
      if (regex) {
        mongoQuery.$or = [
          { title: regex },
          { description: regex },
          { location: regex },
          { sport_type: regex }
        ];
      }

      [docs, total] = await Promise.all([
        EventSchema.find(mongoQuery)
          .sort({ event_date: -1, created_at: -1 })
          .skip(paging.start)
          .limit(paging.limit)
          .lean(),
        EventSchema.countDocuments(mongoQuery)
      ]);

      mongoStrategy = 'regex';

      if (!isMissingTextIndexError(textErr) && textErr.message !== 'text-index:empty') {
        console.warn(`[Search][events] Mongo text query fallback used: ${textErr.message}`);
      }
    }
  } else {
    [docs, total] = await Promise.all([
      EventSchema.find(mongoQuery)
        .sort({ event_date: -1, created_at: -1 })
        .skip(paging.start)
        .limit(paging.limit)
        .lean(),
      EventSchema.countDocuments(mongoQuery)
    ]);
  }

  const mapped = docs.map(mapEventResult);
  const elapsedMs = Date.now() - started;
  const payload = buildResultPayload({
    results: mapped,
    page: paging.page,
    limit: paging.limit,
    total,
    searchMeta: buildBaseMeta({
      engine: 'mongodb',
      collection: 'events',
      fallbackReason,
      elapsedMs,
      strategy: mongoStrategy
    })
  });

  logSearch('events', search, paging.page, paging.limit, 'mongodb', total, elapsedMs, fallbackReason);
  return payload;
}

async function searchTeams({ search = '', page = 1, limit = DEFAULT_LIMIT, sportType } = {}) {
  const started = Date.now();
  const paging = normalizePaging(page, limit);
  const normalizedSportType = String(sportType || '').trim();

  let fallbackReason = null;

  if (solrConfig.enabled && isConfigured()) {
    try {
      const fq = normalizedSportType ? [`sport_type:${escLucene(normalizedSportType)}`] : [];
      const result = await runSolrSearch({
        collection: solrConfig.teamCollection,
        search,
        page: paging.page,
        limit: paging.limit,
        qf: 'name^8 description^3 sport_type^6 status^2',
        pf: 'name^14 sport_type^8 description^4',
        fq
      });

      const docs = (result?.response?.docs || []).map(mapTeamResult);
      const total = Number(result?.response?.numFound || 0);
      const elapsedMs = Date.now() - started;
      const payload = buildResultPayload({
        results: docs,
        page: paging.page,
        limit: paging.limit,
        total,
        searchMeta: buildBaseMeta({ engine: 'solr', collection: 'teams', elapsedMs, strategy: 'edismax' })
      });
      logSearch('teams', search, paging.page, paging.limit, 'solr', total, elapsedMs);
      return payload;
    } catch (err) {
      fallbackReason = err.message;
    }
  }

  const normalizedSearch = String(search || '').trim();
  const mongoQuery = {};
  let mongoStrategy = 'none';
  let docs = [];
  let total = 0;

  if (normalizedSportType) {
    mongoQuery.sport_type = new RegExp(`^${normalizedSportType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }

  if (normalizedSearch) {
    const textQuery = { ...mongoQuery, $text: { $search: normalizedSearch } };
    try {
      [docs, total] = await Promise.all([
        TeamSchema.find(textQuery, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, name: 1, created_at: -1 })
          .skip(paging.start)
          .limit(paging.limit)
          .lean(),
        TeamSchema.countDocuments(textQuery)
      ]);
      mongoStrategy = 'text-index';
      if (docs.length === 0) throw new Error('text-index:empty');
    } catch (textErr) {
      if (!fallbackReason && textErr.message !== 'text-index:empty') {
        fallbackReason = textErr.message;
      }

      const regex = buildRegexSearch(normalizedSearch);
      if (regex) {
        mongoQuery.$or = [
          { name: regex },
          { description: regex },
          { sport_type: regex }
        ];
      }

      [docs, total] = await Promise.all([
        TeamSchema.find(mongoQuery)
          .sort({ name: 1, created_at: -1 })
          .skip(paging.start)
          .limit(paging.limit)
          .lean(),
        TeamSchema.countDocuments(mongoQuery)
      ]);

      mongoStrategy = 'regex';

      if (!isMissingTextIndexError(textErr) && textErr.message !== 'text-index:empty') {
        console.warn(`[Search][teams] Mongo text query fallback used: ${textErr.message}`);
      }
    }
  } else {
    [docs, total] = await Promise.all([
      TeamSchema.find(mongoQuery)
        .sort({ name: 1, created_at: -1 })
        .skip(paging.start)
        .limit(paging.limit)
        .lean(),
      TeamSchema.countDocuments(mongoQuery)
    ]);
  }

  const mapped = docs.map(mapTeamResult);
  const elapsedMs = Date.now() - started;
  const payload = buildResultPayload({
    results: mapped,
    page: paging.page,
    limit: paging.limit,
    total,
    searchMeta: buildBaseMeta({
      engine: 'mongodb',
      collection: 'teams',
      fallbackReason,
      elapsedMs,
      strategy: mongoStrategy
    })
  });

  logSearch('teams', search, paging.page, paging.limit, 'mongodb', total, elapsedMs, fallbackReason);
  return payload;
}

async function searchUsers({ search = '', page = 1, limit = DEFAULT_LIMIT, role } = {}) {
  const started = Date.now();
  const paging = normalizePaging(page, limit);
  const normalizedRole = String(role || '').trim();

  let fallbackReason = null;

  if (solrConfig.enabled && isConfigured()) {
    try {
      const userCollection = solrConfig.userCollection || 'users';
      const fq = normalizedRole ? [`role:${escLucene(normalizedRole)}`] : [];
      const result = await runSolrSearch({
        collection: userCollection,
        search,
        page: paging.page,
        limit: paging.limit,
        qf: 'first_name^8 last_name^8 email^7 role^2 phone^2 status^1',
        pf: 'first_name^10 last_name^10 email^9',
        fq
      });

      const docs = (result?.response?.docs || []).map(mapUserResult);
      const total = Number(result?.response?.numFound || 0);
      const elapsedMs = Date.now() - started;
      const payload = buildResultPayload({
        results: docs,
        page: paging.page,
        limit: paging.limit,
        total,
        searchMeta: buildBaseMeta({ engine: 'solr', collection: 'users', elapsedMs, strategy: 'edismax' })
      });
      logSearch('users', search, paging.page, paging.limit, 'solr', total, elapsedMs);
      return payload;
    } catch (err) {
      fallbackReason = err.message;
    }
  }

  const normalizedSearch = String(search || '').trim();
  const mongoQuery = {};
  let mongoStrategy = 'none';
  let docs = [];
  let total = 0;

  if (normalizedRole) {
    mongoQuery.role = normalizedRole;
  }

  if (normalizedSearch) {
    const textQuery = { ...mongoQuery, $text: { $search: normalizedSearch } };
    try {
      [docs, total] = await Promise.all([
        UserSchema.find(textQuery, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' }, created_at: -1 })
          .skip(paging.start)
          .limit(paging.limit)
          .lean(),
        UserSchema.countDocuments(textQuery)
      ]);
      mongoStrategy = 'text-index';
      if (docs.length === 0) throw new Error('text-index:empty');
    } catch (textErr) {
      if (!fallbackReason && textErr.message !== 'text-index:empty') {
        fallbackReason = textErr.message;
      }

      const regex = buildRegexSearch(normalizedSearch);
      if (regex) {
        mongoQuery.$or = [
          { first_name: regex },
          { last_name: regex },
          { email: regex },
          { role: regex },
          { phone: regex }
        ];
      }

      [docs, total] = await Promise.all([
        UserSchema.find(mongoQuery)
          .sort({ created_at: -1 })
          .skip(paging.start)
          .limit(paging.limit)
          .lean(),
        UserSchema.countDocuments(mongoQuery)
      ]);

      mongoStrategy = 'regex';

      if (!isMissingTextIndexError(textErr) && textErr.message !== 'text-index:empty') {
        console.warn(`[Search][users] Mongo text query fallback used: ${textErr.message}`);
      }
    }
  } else {
    [docs, total] = await Promise.all([
      UserSchema.find(mongoQuery)
        .sort({ created_at: -1 })
        .skip(paging.start)
        .limit(paging.limit)
        .lean(),
      UserSchema.countDocuments(mongoQuery)
    ]);
  }

  const mapped = docs.map(mapUserResult);
  const elapsedMs = Date.now() - started;
  const payload = buildResultPayload({
    results: mapped,
    page: paging.page,
    limit: paging.limit,
    total,
    searchMeta: buildBaseMeta({
      engine: 'mongodb',
      collection: 'users',
      fallbackReason,
      elapsedMs,
      strategy: mongoStrategy
    })
  });

  logSearch('users', search, paging.page, paging.limit, 'mongodb', total, elapsedMs, fallbackReason);
  return payload;
}

module.exports = {
  searchEvents,
  searchTeams,
  searchUsers
};
