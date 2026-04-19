const EventSchema = require('../models/schemas/eventSchema');
const TeamSchema = require('../models/schemas/teamSchema');
const UserSchema = require('../models/schemas/userSchema');
const {
  solrConfig,
  isConfigured,
  solrUpdate,
  solrDeleteByQuery,
  solrCommit
} = require('../config/solr');

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function mapEventDoc(event) {
  return {
    id: String(event._id),
    title: event.title || '',
    description: event.description || '',
    location: event.location || '',
    sport_type: event.sport_type || '',
    status: event.status || '',
    event_date: toIso(event.event_date),
    registration_deadline: toIso(event.registration_deadline),
    organizer_id: event.organizer_id ? String(event.organizer_id) : '',
    updated_at: toIso(event.updatedAt || event.created_at || Date.now())
  };
}

function mapTeamDoc(team) {
  return {
    id: String(team._id),
    name: team.name || '',
    description: team.description || '',
    sport_type: team.sport_type || '',
    manager_id: team.manager_id ? String(team.manager_id) : '',
    current_members: Array.isArray(team.members) ? team.members.length : 0,
    max_members: Number(team.max_members || 0),
    status: 'active',
    updated_at: toIso(team.updatedAt || team.created_at || Date.now())
  };
}

async function reindexEvents({ commit = true } = {}) {
  if (!isConfigured()) {
    throw new Error('Solr is not configured.');
  }

  const events = await EventSchema.find({}).lean();
  const docs = events.map(mapEventDoc);

  await solrDeleteByQuery(solrConfig.eventCollection, '*:*', false);
  if (docs.length > 0) {
    await solrUpdate(solrConfig.eventCollection, docs, false);
  }

  if (commit) {
    await solrCommit(solrConfig.eventCollection);
  }

  return docs.length;
}

async function reindexTeams({ commit = true } = {}) {
  if (!isConfigured()) {
    throw new Error('Solr is not configured.');
  }

  const teams = await TeamSchema.find({}).lean();
  const docs = teams.map(mapTeamDoc);

  await solrDeleteByQuery(solrConfig.teamCollection, '*:*', false);
  if (docs.length > 0) {
    await solrUpdate(solrConfig.teamCollection, docs, false);
  }

  if (commit) {
    await solrCommit(solrConfig.teamCollection);
  }

  return docs.length;
}

async function indexSingleEvent(eventDoc, { commit = true } = {}) {
  if (!isConfigured()) return;
  await solrUpdate(solrConfig.eventCollection, [mapEventDoc(eventDoc)], false);
  if (commit) await solrCommit(solrConfig.eventCollection);
}

async function indexSingleTeam(teamDoc, { commit = true } = {}) {
  if (!isConfigured()) return;
  await solrUpdate(solrConfig.teamCollection, [mapTeamDoc(teamDoc)], false);
  if (commit) await solrCommit(solrConfig.teamCollection);
}

function mapUserDoc(user) {
  return {
    id: String(user._id),
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    role: user.role || '',
    phone: user.phone || '',
    status: user.status || 'active',
    updated_at: toIso(user.updatedAt || user.created_at || Date.now())
  };
}

async function reindexUsers({ commit = true } = {}) {
  if (!isConfigured()) throw new Error('Solr is not configured.');
  const userCollection = solrConfig.userCollection || 'users';
  const users = await UserSchema.find({}).lean();
  const docs = users.map(mapUserDoc);
  await solrDeleteByQuery(userCollection, '*:*', false);
  if (docs.length > 0) await solrUpdate(userCollection, docs, false);
  if (commit) await solrCommit(userCollection);
  return docs.length;
}

async function indexSingleUser(userDoc, { commit = true } = {}) {
  if (!isConfigured()) return;
  const userCollection = solrConfig.userCollection || 'users';
  await solrUpdate(userCollection, [mapUserDoc(userDoc)], false);
  if (commit) await solrCommit(userCollection);
}

module.exports = {
  mapEventDoc,
  mapTeamDoc,
  mapUserDoc,
  reindexEvents,
  reindexTeams,
  reindexUsers,
  indexSingleEvent,
  indexSingleTeam,
  indexSingleUser
};
