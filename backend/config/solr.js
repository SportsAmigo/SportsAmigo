const DEFAULT_TIMEOUT_MS = Number(process.env.SOLR_TIMEOUT_MS || 1500);

function normalizeSolrBaseUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  // Accept either provider URL styles:
  // - https://host
  // - https://host/solr
  // - https://host/solr/
  // Internal request builder appends /solr/<collection> paths.
  return value
    .replace(/\/$/, '')
    .replace(/\/solr$/i, '');
}

const solrConfig = {
  enabled: process.env.ENABLE_SOLR_SEARCH === 'true',
  baseUrl: normalizeSolrBaseUrl(process.env.SOLR_BASE_URL),
  username: process.env.SOLR_USERNAME || '',
  password: process.env.SOLR_PASSWORD || '',
  eventCollection: process.env.SOLR_EVENT_COLLECTION || 'events',
  teamCollection: process.env.SOLR_TEAM_COLLECTION || 'teams',
  userCollection: process.env.SOLR_USER_COLLECTION || 'users',
  timeoutMs: DEFAULT_TIMEOUT_MS
};

function isConfigured() {
  return Boolean(solrConfig.baseUrl);
}

function authHeader() {
  if (!solrConfig.username || !solrConfig.password) {
    return {};
  }

  const token = Buffer.from(`${solrConfig.username}:${solrConfig.password}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

async function request(path, options = {}) {
  if (!isConfigured()) {
    throw new Error('Solr is not configured. Set SOLR_BASE_URL.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), solrConfig.timeoutMs);

  try {
    const response = await fetch(`${solrConfig.baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const reason = payload?.error?.msg || payload?.error || `HTTP ${response.status}`;
      throw new Error(`Solr request failed: ${reason}`);
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

function selectCollection(collection) {
  if (!collection) {
    throw new Error('Collection is required');
  }

  return `/solr/${collection}`;
}

async function solrQuery(collection, params) {
  const searchParams = new URLSearchParams(params || {});
  return request(`${selectCollection(collection)}/select?${searchParams.toString()}`, { method: 'GET' });
}

async function solrUpdate(collection, docs = [], commit = false) {
  const path = `${selectCollection(collection)}/update${commit ? '?commit=true' : ''}`;
  return request(path, {
    method: 'POST',
    body: docs
  });
}

async function solrDeleteByQuery(collection, query = '*:*', commit = false) {
  const path = `${selectCollection(collection)}/update${commit ? '?commit=true' : ''}`;
  return request(path, {
    method: 'POST',
    body: { delete: { query } }
  });
}

async function solrCommit(collection) {
  return request(`${selectCollection(collection)}/update`, {
    method: 'POST',
    body: { commit: {} }
  });
}

module.exports = {
  solrConfig,
  isConfigured,
  solrQuery,
  solrUpdate,
  solrDeleteByQuery,
  solrCommit
};
