const fs = require('fs');
const path = require('path');

// ─── 1. Add missing controller methods ───────────────────────────────────────
const controllerFile = path.join(__dirname, '../../backend/controllers/adminController.js');
let ctrl = fs.readFileSync(controllerFile, 'utf8');

const newMethods = `
    /**
     * Get match details by ID with full context (teams, event, organizer, managers)
     */
    getMatchDetailsById: async function (matchId) {
        try {
            const match = await MatchSchema.findById(matchId)
                .populate('team_a', 'name sport_type manager_id')
                .populate('team_b', 'name sport_type manager_id')
                .populate('event_id', 'title name sport_type location event_date organizer_id')
                .lean();
            if (!match) throw new Error('Match not found');

            // Fetch manager names
            let team1Manager = null, team2Manager = null, organizerName = null, organizerId = null;
            try {
                if (match.team_a?.manager_id) {
                    const mgr = await UserSchema.findById(match.team_a.manager_id).select('first_name last_name').lean();
                    if (mgr) team1Manager = \`\${mgr.first_name || ''} \${mgr.last_name || ''}\`.trim();
                }
                if (match.team_b?.manager_id) {
                    const mgr = await UserSchema.findById(match.team_b.manager_id).select('first_name last_name').lean();
                    if (mgr) team2Manager = \`\${mgr.first_name || ''} \${mgr.last_name || ''}\`.trim();
                }
                if (match.event_id?.organizer_id) {
                    const org = await UserSchema.findById(match.event_id.organizer_id).select('first_name last_name').lean();
                    if (org) { organizerName = \`\${org.first_name || ''} \${org.last_name || ''}\`.trim(); organizerId = match.event_id.organizer_id; }
                }
            } catch (e) {}

            return {
                id: match._id,
                team1_id: match.team_a?._id || null,
                team1_name: match.team_a?.name || 'TBD',
                team1_manager: team1Manager,
                team2_id: match.team_b?._id || null,
                team2_name: match.team_b?.name || 'TBD',
                team2_manager: team2Manager,
                team1_score: match.score_a ?? match.team_a_score ?? null,
                team2_score: match.score_b ?? match.team_b_score ?? null,
                event_id: match.event_id?._id || null,
                event_name: match.event_id?.title || match.event_id?.name || null,
                organizer_id: organizerId,
                organizer_name: organizerName,
                match_date: match.match_date,
                venue: match.venue || match.location || 'TBD',
                status: match.status || 'scheduled',
                sport_type: match.event_id?.sport_type || null,
                notes: match.notes || '',
                winner: match.winner || null
            };
        } catch (err) {
            console.error('Error getting match details:', err);
            throw err;
        }
    },

    /**
     * Get team details by ID with members (full profiles), manager profile, events, matches
     */
    getTeamDetailsById: async function (teamId) {
        try {
            const team = await TeamSchema.findById(teamId)
                .populate('manager_id', 'first_name last_name email profile_image')
                .lean();
            if (!team) throw new Error('Team not found');

            const result = {
                id: team._id,
                name: team.name,
                sport_type: team.sport_type,
                status: team.status || 'active',
                description: team.description,
                location: team.location,
                max_members: team.max_members,
                current_members: team.members ? team.members.length : 0,
                createdAt: team.created_at || team.createdAt,
                manager: null,
                manager_name: null,
                members: [],
                events: [],
                matches: []
            };

            // Manager
            if (team.manager_id) {
                const mgr = team.manager_id;
                result.manager = {
                    id: mgr._id,
                    name: \`\${mgr.first_name || ''} \${mgr.last_name || ''}\`.trim(),
                    email: mgr.email,
                    profile_image: mgr.profile_image
                };
                result.manager_name = result.manager.name;
            }

            // Members with full profiles
            if (team.members && team.members.length > 0) {
                const memberIds = team.members.map(m => m.player_id || m.user_id || m._id).filter(Boolean);
                const memberDocs = await UserSchema.find({ _id: { $in: memberIds } }).select('first_name last_name email profile_image').lean();
                const memberMap = {};
                memberDocs.forEach(m => { memberMap[m._id.toString()] = m; });
                result.members = team.members.map((m, i) => {
                    const mid = (m.player_id || m.user_id || m._id)?.toString();
                    const doc = mid ? memberMap[mid] : null;
                    return {
                        id: m.player_id || m.user_id || m._id,
                        name: doc ? \`\${doc.first_name || ''} \${doc.last_name || ''}\`.trim() : (m.name || \`Member \${i+1}\`),
                        email: doc?.email,
                        profile_image: doc?.profile_image,
                        position: m.position || null,
                        player_id: m.player_id || m.user_id || m._id
                    };
                });
            }

            // Events this team participated in
            try {
                const events = await EventSchema.find({ 'team_registrations.team_id': team._id }).select('title name status event_date location sport_type').limit(10).lean();
                result.events = events.map(e => ({ id: e._id, title: e.title || e.name, status: e.status, date: e.event_date, location: e.location, sport_type: e.sport_type }));
            } catch (e) {}

            // Matches
            try {
                const matches = await MatchSchema.find({ $or: [{ team_a: team._id }, { team_b: team._id }] })
                    .populate('team_a', 'name').populate('team_b', 'name').populate('event_id', 'title')
                    .sort({ match_date: -1 }).limit(10).lean();
                result.matches = matches.map(m => ({
                    id: m._id,
                    team1_id: m.team_a?._id,
                    team1_name: m.team_a?.name || 'TBD',
                    team2_id: m.team_b?._id,
                    team2_name: m.team_b?.name || 'TBD',
                    team1_score: m.score_a ?? m.team_a_score ?? null,
                    team2_score: m.score_b ?? m.team_b_score ?? null,
                    status: m.status, match_date: m.match_date,
                    event_name: m.event_id?.title || null
                }));
            } catch (e) {}

            return result;
        } catch (err) {
            console.error('Error getting team details:', err);
            throw err;
        }
    },

    /**
     * Get event details by ID with organizer, teams (with manager+members), matches
     */
    getEventDetailsById: async function (eventId) {
        try {
            const event = await EventSchema.findById(eventId)
                .populate('organizer_id', 'first_name last_name email profile_image organization_name')
                .lean();
            if (!event) throw new Error('Event not found');

            const result = {
                id: event._id,
                title: event.title || event.name,
                sport_type: event.sport_type || event.category,
                status: event.status,
                event_date: event.event_date,
                location: event.location,
                description: event.description,
                max_teams: event.max_teams,
                registration_fee: event.registration_fee,
                is_paid: event.is_paid,
                commission_rate: event.commission_rate,
                organizer_id: event.organizer_id?._id || event.organizer_id,
                organizer_name: null,
                organizer: null,
                teams: [],
                matches: []
            };

            // Organizer
            if (event.organizer_id && typeof event.organizer_id === 'object') {
                const org = event.organizer_id;
                result.organizer_name = \`\${org.first_name || ''} \${org.last_name || ''}\`.trim();
                result.organizer = { id: org._id, name: result.organizer_name, email: org.email, profile_image: org.profile_image };
            }

            // Teams with manager names and member count
            if (event.team_registrations && event.team_registrations.length > 0) {
                const teamIds = event.team_registrations.map(r => r.team_id).filter(Boolean);
                const teams = await TeamSchema.find({ _id: { $in: teamIds } })
                    .populate('manager_id', 'first_name last_name email profile_image')
                    .lean();
                result.teams = teams.map(t => ({
                    id: t._id,
                    name: t.name,
                    sport_type: t.sport_type,
                    manager_name: t.manager_id ? \`\${t.manager_id.first_name || ''} \${t.manager_id.last_name || ''}\`.trim() : 'N/A',
                    manager: t.manager_id ? { id: t.manager_id._id, name: \`\${t.manager_id.first_name || ''} \${t.manager_id.last_name || ''}\`.trim(), email: t.manager_id.email, profile_image: t.manager_id.profile_image } : null,
                    members: t.members ? t.members.length : 0,
                    current_members: t.members ? t.members.length : 0
                }));
            }

            // Matches
            try {
                const matches = await MatchSchema.find({ event_id: event._id })
                    .populate('team_a', 'name').populate('team_b', 'name')
                    .sort({ match_date: 1 }).lean();
                result.matches = matches.map(m => ({
                    id: m._id,
                    team1_id: m.team_a?._id,
                    team1_name: m.team_a?.name || 'TBD',
                    team2_id: m.team_b?._id,
                    team2_name: m.team_b?.name || 'TBD',
                    team1_score: m.score_a ?? m.team_a_score ?? null,
                    team2_score: m.score_b ?? m.team_b_score ?? null,
                    status: m.status,
                    match_date: m.match_date
                }));
            } catch (e) {}

            return result;
        } catch (err) {
            console.error('Error getting event details:', err);
            throw err;
        }
    },
`;

// Find the insertion point — after the empty line that was left after deleting old getMatchDetailsById
const insertMarker = '\n    /**\n     * Get dashboard statistics for admin\n';
const insertIdx = ctrl.indexOf(insertMarker);
if (insertIdx !== -1) {
    ctrl = ctrl.slice(0, insertIdx) + newMethods + ctrl.slice(insertIdx);
    fs.writeFileSync(controllerFile, ctrl, 'utf8');
    console.log('SUCCESS: Added getMatchDetailsById, getTeamDetailsById, getEventDetailsById to adminController.js');
} else {
    console.log('ERROR: Could not find insertion point. Marker not found.');
    console.log('Trying alternative...');
    // Try another marker
    const altMarker = '    getDashboardStats:';
    const altIdx = ctrl.indexOf(altMarker);
    if (altIdx !== -1) {
        ctrl = ctrl.slice(0, altIdx) + newMethods.trim() + '\n\n' + ctrl.slice(altIdx);
        fs.writeFileSync(controllerFile, ctrl, 'utf8');
        console.log('SUCCESS via alternative marker');
    } else {
        console.log('FAIL: Could not find any insertion point');
    }
}

// ─── 2. Append missing entity detail routes to admin.js ──────────────────────
const routesFile = path.join(__dirname, '../../backend/routes/admin.js');
let routes = fs.readFileSync(routesFile, 'utf8');

const newRoutes = `
// ─── Entity Detail Endpoints (for AdminEntityModal deep-linking) ─────────────

// User detail (any role) by ID → calls getUserDetailsById
router.get('/api/users/:id', async (req, res) => {
  try {
    const data = await adminController.getUserDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// Role-specific user detail aliases
['players','managers','organizers','coordinators'].forEach(role => {
  router.get(\`/api/\${role}/:id\`, async (req, res) => {
    try {
      const data = await adminController.getUserDetailsById(req.params.id);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message });
    }
  });
});

// Team detail by ID
router.get('/api/teams/:id', async (req, res) => {
  try {
    const data = await adminController.getTeamDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// Event detail by ID
router.get('/api/events/:id', async (req, res) => {
  try {
    const data = await adminController.getEventDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// Match detail by ID
router.get('/api/matches/:id', async (req, res) => {
  try {
    const data = await adminController.getMatchDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});

// Delete match by ID
router.delete('/matches/:id', async (req, res) => {
  try {
    const MatchSchema = require('../models/schemas/matchSchema');
    await MatchSchema.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Match deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete any user by id (coordinator)
router.delete('/users/coordinator/:id', async (req, res) => {
  try {
    const UserSchema = require('../models/schemas/userSchema');
    await UserSchema.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Coordinator deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Coordinator detail
router.get('/api/coordinators/:id', async (req, res) => {
  try {
    const data = await adminController.getUserDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
});
`;

// Insert before module.exports
const exportIdx = routes.lastIndexOf('module.exports = router;');
if (exportIdx !== -1 && !routes.includes('/api/teams/:id')) {
    routes = routes.slice(0, exportIdx) + newRoutes + '\n' + routes.slice(exportIdx);
    fs.writeFileSync(routesFile, routes, 'utf8');
    console.log('SUCCESS: Appended entity detail routes to admin.js');
} else if (routes.includes('/api/teams/:id')) {
    console.log('Routes already exist, skipping');
} else {
    console.log('FAIL: Could not find module.exports marker in admin.js');
}

console.log('Done');
