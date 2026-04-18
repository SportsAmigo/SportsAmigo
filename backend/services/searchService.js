const Event = require('../models/event');
const Team = require('../models/team');
const { solrConfig, isConfigured, solrQuery } = require('../config/solr');

function esc(value) {
  return String(value || '').replace(/([+\-!(){}\[\]^\"~*?:\\/]|&&|\|\|)/g, '\\$1');
}

function buildSolrQuery(searchText) {
  const text = String(searchText || '').trim();
  if (!text) return '*:*';
  return `${esc(text)}~2 OR ${esc(text)}*`;
}

async function searchEvents({ search = '', page = 1, limit = 20, statuses = [] } = {}) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 20));

  if (solrConfig.enabled && isConfigured()) {
    try {
      const start = (normalizedPage - 1) * normalizedLimit;
      const q = buildSolrQuery(search);
      const fq = Array.isArray(statuses) && statuses.length > 0
        ? statuses.map((status) => `status:${esc(status)}`)
        : [];

      const result = await solrQuery(solrConfig.eventCollection, {
        q,
        wt: 'json',
        defType: 'edismax',
        qf: 'title^4 description^2 location^2 sport_type',
        start,
        rows: normalizedLimit,
        ...(fq.length ? { fq } : {})
      });

      const docs = result?.response?.docs || [];
      const total = result?.response?.numFound || 0;

      return {
        success: true,
        data: docs,
        pagination: { page: normalizedPage, limit: normalizedLimit, total },
        searchMeta: { engine: 'solr' }
      };
    } catch (err) {
      console.warn('[Search] Solr events fallback:', err.message);
    }
  }

  const events = await Event.searchEvents({
    query: search,
    statuses,
    limit: normalizedLimit
  });

  return {
    success: true,
    data: events,
    pagination: { page: normalizedPage, limit: normalizedLimit, total: events.length },
    searchMeta: { engine: 'fallback-mongodb' }
  };
}

async function searchTeams({ search = '', page = 1, limit = 20, sportType } = {}) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 20));

  if (solrConfig.enabled && isConfigured()) {
    try {
      const start = (normalizedPage - 1) * normalizedLimit;
      const q = buildSolrQuery(search);
      const fq = sportType ? [`sport_type:${esc(sportType)}`] : [];

      const result = await solrQuery(solrConfig.teamCollection, {
        q,
        wt: 'json',
        defType: 'edismax',
        qf: 'name^4 description^2 sport_type',
        start,
        rows: normalizedLimit,
        ...(fq.length ? { fq } : {})
      });

      const docs = result?.response?.docs || [];
      const total = result?.response?.numFound || 0;

      return {
        success: true,
        data: docs,
        pagination: { page: normalizedPage, limit: normalizedLimit, total },
        searchMeta: { engine: 'solr' }
      };
    } catch (err) {
      console.warn('[Search] Solr teams fallback:', err.message);
    }
  }

  const teams = await Team.getAllTeams();
  const query = String(search || '').trim().toLowerCase();
  const filtered = teams.filter((team) => {
    const matchesSearch = !query ||
      String(team.name || '').toLowerCase().includes(query) ||
      String(team.description || '').toLowerCase().includes(query) ||
      String(team.sport_type || '').toLowerCase().includes(query);

    const matchesSport = !sportType ||
      String(team.sport_type || '').toLowerCase() === String(sportType).toLowerCase();

    return matchesSearch && matchesSport;
  });

  return {
    success: true,
    data: filtered.slice(0, normalizedLimit),
    pagination: { page: normalizedPage, limit: normalizedLimit, total: filtered.length },
    searchMeta: { engine: 'fallback-mongodb' }
  };
}

module.exports = {
  searchEvents,
  searchTeams
};
