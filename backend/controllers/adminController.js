const User = require('../models/user');
const Team = require('../models/team');
const Event = require('../models/event');
const mongoose = require('mongoose');
const UserSchema = require('../models/schemas/userSchema');
const EventSchema = require('../models/schemas/eventSchema');
const SubscriptionSchema = require('../models/schemas/subscriptionSchema');
const CommissionSchema = require('../models/schemas/commissionSchema');
const VASSchema = require('../models/schemas/vasSchema');
const MatchSchema = require('../models/schemas/matchSchema');
const TeamSchema = require('../models/schemas/teamSchema');

const ROLE_LIST = ['player', 'manager', 'organizer', 'coordinator'];

function getStartOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function mapScoreField(match, legacyKey, currentKey) {
    if (typeof match[currentKey] === 'number') {
        return match[currentKey];
    }
    if (typeof match[legacyKey] === 'number') {
        return match[legacyKey];
    }
    return null;
}

/**
 * Admin controller to handle admin-specific operations
 */
module.exports = {
    /**
     * Get all users with role-specific information
     * @param {string} role - User role (player, manager, organizer, coordinator)
     * @returns {Promise<Array>} - Promise resolving to array of users with role-specific info
     */
    getAllUsersByRole: async function (role) {
        try {
            // Validate role
            if (!ROLE_LIST.includes(role)) {
                throw new Error('Invalid role');
            }

            // Coordinators are represented by either coordinator or moderator role in existing data.
            const users = role === 'coordinator'
                ? await UserSchema.find({ role: { $in: ['coordinator', 'moderator'] } }).sort({ first_name: 1, last_name: 1 })
                : await User.getAllUsers({ role });

            // Format users based on role
            const formattedUsers = [];

            for (const user of users) {
                // Common information
                const userInfo = {
                    id: user._id,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed',
                    email: user.email,
                    role: role === 'coordinator' ? 'coordinator' : user.role,
                    profile_image: user.profile_image,
                    joinedDate: user.created_at,
                    status: 'Active', // Default status
                    isExample: false
                };

                // Role-specific information
                switch (role) {
                    case 'player':
                        userInfo.sport = user.profile && user.profile.preferred_sports
                            ? user.profile.preferred_sports
                            : 'Unspecified';

                        // Try to find team info using the Team model
                        try {
                            const teamInfo = await Team.getTeamForPlayer(user._id);
                            userInfo.team = teamInfo ? teamInfo.name : 'Unassigned';
                        } catch (err) {
                            console.error('Error getting team for player:', err);
                            userInfo.team = 'Unassigned';
                        }
                        break;

                    case 'manager':
                        // Get team info from profile or team collection
                        if (user.profile && user.profile.team_name) {
                            userInfo.team = user.profile.team_name;
                        } else {
                            try {
                                const teamInfo = await Team.getTeamsByManager(user._id);
                                userInfo.team = teamInfo && teamInfo.length > 0 ? teamInfo[0].name : 'No Team';
                            } catch (err) {
                                console.error('Error getting team for manager:', err);
                                userInfo.team = 'No Team';
                            }
                        }
                        break;

                    case 'organizer':
                        userInfo.organization = user.profile && user.profile.organization_name
                            ? user.profile.organization_name
                            : 'Unspecified';
                        userInfo.tier = user.organizerTier || 'new';
                        userInfo.verificationStatus = user.verificationStatus || 'pending';

                        // Get count of events organized using Event model
                        try {
                            const events = await Event.getEventsByOrganizer(user._id);
                            userInfo.eventsCount = events ? events.length : 0;
                        } catch (err) {
                            console.error('Error getting event count for organizer:', err);
                            userInfo.eventsCount = 0;
                        }
                        break;

                    case 'coordinator':
                        userInfo.region = user.moderatorRegion || 'all';
                        userInfo.category = user.moderatorCategory || 'all';
                        userInfo.verificationStatus = user.verificationStatus || 'verified';
                        userInfo.status = user.verificationStatus === 'suspended' ? 'Suspended' : 'Active';
                        break;
                }

                formattedUsers.push(userInfo);
            }

            return formattedUsers;
        } catch (err) {
            console.error(`Error getting ${role}s:`, err);
            throw err;
        }
    },

    /**
     * Get user details by ID with role-specific cross-linked information
     */
    getUserDetailsById: async function (userId) {
        try {
            const user = await User.getUserById(userId);
            if (!user) throw new Error('User not found');

            const uid = user._id;

            // Common base details
            const userDetails = {
                id: uid,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed',
                email: user.email,
                role: user.role,
                profile_image: user.profile_image,
                phone: user.phone || '',
                bio: user.bio || '',
                created_at: user.created_at,
                details: {
                    join_date: user.profile ? user.profile.join_date : user.created_at
                }
            };

            switch (user.role) {
                case 'player': {
                    userDetails.details.age = user.profile ? user.profile.age : null;
                    userDetails.details.address = user.profile ? user.profile.address : null;
                    userDetails.details.preferred_sports = user.profile ? user.profile.preferred_sports : null;

                    // Teams player belongs to
                    try {
                        const playerTeams = await TeamSchema.find({ 'members.player_id': uid }).select('name sport_type manager_id').lean();
                        userDetails.teams = playerTeams.map(t => ({ id: t._id, name: t.name, sport: t.sport_type }));
                        userDetails.team = userDetails.teams.length > 0 ? userDetails.teams[0].name : 'Unassigned';
                        // Match history for player's teams
                        const teamIds = playerTeams.map(t => t._id);
                        if (teamIds.length > 0) {
                            const matches = await MatchSchema.find({ $or: [{ team_a: { $in: teamIds } }, { team_b: { $in: teamIds } }] })
                                .populate('team_a', 'name').populate('team_b', 'name').populate('event_id', 'title name').sort({ match_date: -1 }).limit(10).lean();
                            userDetails.matches = matches.map(m => ({
                                id: m._id, event: m.event_id?.title || m.event_id?.name || 'N/A',
                                team_a: m.team_a?.name || 'TBD', team_b: m.team_b?.name || 'TBD',
                                score_a: m.score_a ?? m.team_a_score ?? null, score_b: m.score_b ?? m.team_b_score ?? null,
                                status: m.status, date: m.match_date
                            }));
                        } else { userDetails.matches = []; }
                    } catch (err) { userDetails.teams = []; userDetails.team = 'Unassigned'; userDetails.matches = []; }

                    // VAS purchases
                    try {
                        const vas = await VASSchema.find({ userId: uid, paymentStatus: 'completed' }).select('serviceType price createdAt').lean();
                        userDetails.vas_purchases = vas.map(v => ({ service: v.serviceType, amount: v.price, date: v.createdAt }));
                    } catch (err) { userDetails.vas_purchases = []; }
                    break;
                }

                case 'manager': {
                    userDetails.details.team_name = user.profile ? user.profile.team_name : null;
                    try {
                        const managedTeams = await Team.getTeamsByManager(uid);
                        userDetails.team = managedTeams && managedTeams.length > 0 ? managedTeams[0].name : (user.profile?.team_name || 'No Team');
                        userDetails.managed_teams = (managedTeams || []).map(t => ({
                            id: t._id, name: t.name, sport: t.sport_type,
                            members_count: t.members ? t.members.length : 0
                        }));
                        // Events for managed teams
                        const teamIds = (managedTeams || []).map(t => t._id);
                        const events = teamIds.length > 0
                            ? await EventSchema.find({ 'team_registrations.team_id': { $in: teamIds } }).select('title status event_date location').limit(10).lean()
                            : [];
                        userDetails.events = events.map(e => ({ id: e._id, name: e.title, date: e.event_date, status: e.status }));
                        // Match history
                        const matches = teamIds.length > 0
                            ? await MatchSchema.find({ $or: [{ team_a: { $in: teamIds } }, { team_b: { $in: teamIds } }] })
                                .populate('team_a', 'name').populate('team_b', 'name').populate('event_id', 'title').sort({ match_date: -1 }).limit(10).lean()
                            : [];
                        userDetails.matches = matches.map(m => ({
                            id: m._id, event: m.event_id?.title || 'N/A',
                            team_a: m.team_a?.name || 'TBD', team_b: m.team_b?.name || 'TBD',
                            score_a: m.score_a ?? m.team_a_score ?? null, score_b: m.score_b ?? m.team_b_score ?? null,
                            status: m.status, date: m.match_date
                        }));
                    } catch (err) { userDetails.team = 'No Team'; userDetails.managed_teams = []; userDetails.events = []; userDetails.matches = []; }
                    break;
                }

                case 'organizer': {
                    userDetails.details.organization_name = user.profile?.organization_name || 'Unspecified';
                    userDetails.organization = user.profile?.organization_name || 'Unspecified';
                    userDetails.details.tier = user.organizerTier || 'new';
                    userDetails.details.verificationStatus = user.verificationStatus || 'pending';
                    try {
                        const [events, subscription, vas, commissions] = await Promise.all([
                            Event.getEventsByOrganizer(uid),
                            SubscriptionSchema.findOne({ user: uid }).sort({ createdAt: -1 }).lean(),
                            VASSchema.find({ userId: uid }).sort({ createdAt: -1 }).limit(10).lean(),
                            CommissionSchema.find({ organizer: uid }).populate('event', 'title').sort({ createdAt: -1 }).limit(10).lean()
                        ]);
                        userDetails.events_count = events ? events.length : 0;
                        userDetails.events = (events || []).map(e => ({ id: e._id, name: e.title || e.name, date: e.event_date, status: e.status, location: e.location, teams: e.team_registrations?.length || 0 }));
                        userDetails.subscription = subscription ? { plan: subscription.plan, status: subscription.status, billing: subscription.billingCycle, startDate: subscription.startDate, endDate: subscription.endDate } : null;
                        userDetails.vas_purchases = vas.map(v => ({ service: v.serviceType, amount: v.price, status: v.paymentStatus, date: v.createdAt }));
                        userDetails.commissions = commissions.map(c => ({ event: c.event?.title || 'N/A', amount: c.commissionAmount, payout: c.organizerPayout, status: c.status, date: c.createdAt }));
                    } catch (err) { userDetails.events = []; userDetails.subscription = null; userDetails.vas_purchases = []; userDetails.commissions = []; }
                    break;
                }

                case 'coordinator':
                case 'moderator': {
                    userDetails.details.region = user.moderatorRegion || 'all';
                    userDetails.details.category = user.moderatorCategory || 'all';
                    userDetails.details.verificationStatus = user.verificationStatus || 'verified';
                    try {
                        const [reviewedEvents, reviewedOrgs] = await Promise.all([
                            EventSchema.find({ 'approvalStatus.reviewedBy': uid }).select('title status approvalStatus.reviewedAt').sort({ 'approvalStatus.reviewedAt': -1 }).limit(20).lean(),
                            UserSchema.find({ role: 'organizer', 'verificationDocuments.reviewedBy': uid }).select('first_name last_name email verificationStatus').limit(20).lean()
                        ]);
                        userDetails.reviewed_events = reviewedEvents.map(e => ({ id: e._id, name: e.title, status: e.status, date: e.approvalStatus?.reviewedAt }));
                        userDetails.reviewed_organizers = reviewedOrgs.map(o => ({ id: o._id, name: `${o.first_name || ''} ${o.last_name || ''}`.trim(), email: o.email, status: o.verificationStatus }));
                        userDetails.actions_count = reviewedEvents.length + reviewedOrgs.length;
                    } catch (err) { userDetails.reviewed_events = []; userDetails.reviewed_organizers = []; userDetails.actions_count = 0; }
                    break;
                }
            }

            return userDetails;
        } catch (err) {
            console.error('Error getting user details:', err);
            throw err;
        }
    },



    /**
     * Get dashboard statistics for admin
     * @returns {Promise<object>} - Promise resolving to dashboard statistics
     */
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
                    if (mgr) team1Manager = `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim();
                }
                if (match.team_b?.manager_id) {
                    const mgr = await UserSchema.findById(match.team_b.manager_id).select('first_name last_name').lean();
                    if (mgr) team2Manager = `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim();
                }
                if (match.event_id?.organizer_id) {
                    const org = await UserSchema.findById(match.event_id.organizer_id).select('first_name last_name').lean();
                    if (org) { organizerName = `${org.first_name || ''} ${org.last_name || ''}`.trim(); organizerId = match.event_id.organizer_id; }
                }
            } catch (e) { }

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
                    name: `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim(),
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
                        name: doc ? `${doc.first_name || ''} ${doc.last_name || ''}`.trim() : (m.name || `Member ${i + 1}`),
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
            } catch (e) { }

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
            } catch (e) { }

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
                matches: [],
                winner: event.winner || event.winning_team_name || null,
                winning_team_id: event.winning_team || event.winner_team_id || null,
            };


            // Organizer
            if (event.organizer_id && typeof event.organizer_id === 'object') {
                const org = event.organizer_id;
                result.organizer_name = `${org.first_name || ''} ${org.last_name || ''}`.trim();
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
                    manager_name: t.manager_id ? `${t.manager_id.first_name || ''} ${t.manager_id.last_name || ''}`.trim() : 'N/A',
                    manager: t.manager_id ? { id: t.manager_id._id, name: `${t.manager_id.first_name || ''} ${t.manager_id.last_name || ''}`.trim(), email: t.manager_id.email, profile_image: t.manager_id.profile_image } : null,
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
            } catch (e) { }

            return result;
        } catch (err) {
            console.error('Error getting event details:', err);
            throw err;
        }
    },

    getDashboardStats: async function () {
        try {
            // User stats - get all users and count them
            const allUsers = await User.getAllUsers();
            const totalUsers = allUsers.length;

            // Count users by role
            const playerCount = allUsers.filter(user => user.role === 'player').length;
            const managerCount = allUsers.filter(user => user.role === 'manager').length;
            const organizerCount = allUsers.filter(user => user.role === 'organizer').length;
            const coordinatorCount = allUsers.filter(user => user.role === 'coordinator' || user.role === 'moderator').length;

            // Team stats - get all teams and count them
            const allTeams = await Team.getAllTeams();
            const totalTeams = allTeams ? allTeams.length : 0;

            // Count teams by sport type
            const teamsByType = [];
            if (allTeams && allTeams.length > 0) {
                // Group teams by sport_type and count
                const sportTypeCount = {};
                allTeams.forEach(team => {
                    const sportType = team.sport_type || 'Unspecified';
                    sportTypeCount[sportType] = (sportTypeCount[sportType] || 0) + 1;
                });

                // Convert to array of {_id, count} for compatibility
                for (const [sportType, count] of Object.entries(sportTypeCount)) {
                    teamsByType.push({ _id: sportType, count });
                }
            }

            // Event stats - get all events
            const allEvents = await Event.getAllEvents();
            const totalEvents = allEvents ? allEvents.length : 0;

            // Count upcoming and past events
            const now = new Date();
            const upcomingEvents = allEvents ?
                allEvents.filter(event => new Date(event.event_date) > now).length : 0;
            const pastEvents = allEvents ?
                allEvents.filter(event => new Date(event.event_date) <= now).length : 0;

            const [subscriptionStats, commissionStats, vasRevenueStats, expiringSubscriptions, pendingOrganizerVerifications, pendingEventApprovals] = await Promise.all([
                SubscriptionSchema.aggregate([
                    { $match: { status: 'active', endDate: { $gte: new Date() } } },
                    {
                        $group: {
                            _id: '$plan',
                            count: { $sum: 1 },
                            monthlyRevenue: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$billingCycle', 'yearly'] },
                                        { $divide: ['$pricing.yearly', 12] },
                                        '$pricing.monthly'
                                    ]
                                }
                            }
                        }
                    }
                ]),
                CommissionSchema.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            totalCommission: { $sum: '$commissionAmount' }
                        }
                    }
                ]),
                VASSchema.aggregate([
                    { $match: { paymentStatus: 'completed' } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$price' }
                        }
                    }
                ]),
                SubscriptionSchema.countDocuments({
                    status: 'active',
                    endDate: {
                        $gte: new Date(),
                        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                }),
                UserSchema.countDocuments({ role: 'organizer', verificationStatus: 'pending' }),
                EventSchema.countDocuments({ status: 'pending_approval' })
            ]);

            const subscriptionByPlan = { free: 0, pro: 0, enterprise: 0 };
            let activeSubscriptions = 0;
            let subscriptionMonthlyRevenue = 0;
            subscriptionStats.forEach((row) => {
                subscriptionByPlan[row._id] = row.count;
                activeSubscriptions += row.count;
                subscriptionMonthlyRevenue += row.monthlyRevenue || 0;
            });

            const commissionByStatus = {};
            let pendingPayoutCount = 0;
            commissionStats.forEach((row) => {
                commissionByStatus[row._id] = row.count;
                if (row._id === 'pending' || row._id === 'processing') {
                    pendingPayoutCount += row.count;
                }
            });

            const todayStart = getStartOfDay();
            const [coordinatorOrganizerActionsToday, coordinatorEventActionsToday] = await Promise.all([
                UserSchema.countDocuments({
                    role: 'organizer',
                    'verificationDocuments.reviewedAt': { $gte: todayStart }
                }),
                EventSchema.countDocuments({
                    'approvalStatus.reviewedAt': { $gte: todayStart }
                })
            ]);

            const coordinatorActionsToday = coordinatorOrganizerActionsToday + coordinatorEventActionsToday;
            const vasMonthlyRevenue = vasRevenueStats[0]?.totalRevenue || 0;

            return {
                users: {
                    total: totalUsers,
                    players: playerCount,
                    managers: managerCount,
                    organizers: organizerCount,
                    coordinators: coordinatorCount
                },
                teams: {
                    total: totalTeams,
                    byType: teamsByType
                },
                events: {
                    total: totalEvents,
                    upcoming: upcomingEvents,
                    past: pastEvents
                },
                subscriptions: {
                    active: activeSubscriptions,
                    expiringIn7Days: expiringSubscriptions,
                    monthlyRevenue: Math.round(subscriptionMonthlyRevenue),
                    byPlan: subscriptionByPlan
                },
                commissions: {
                    byStatus: commissionByStatus,
                    pendingPayoutCount
                },
                verification: {
                    pendingOrganizers: pendingOrganizerVerifications,
                    pendingEvents: pendingEventApprovals
                },
                coordinator: {
                    actionsToday: coordinatorActionsToday
                },
                vas: {
                    monthlyRevenue: Math.round(vasMonthlyRevenue)
                }
            };
        } catch (err) {
            console.error('Error getting dashboard stats:', err);
            throw err;
        }
    },

    /**
     * Get recent system activities for admin dashboard
     * @param {number} limit - Maximum number of activities to return
     * @returns {Promise<Array>} - Promise resolving to array of activity objects
     */
    getRecentActivities: async function (limit = 10) {
        try {
            // This is a placeholder function until a proper Activity model is implemented
            // In a real implementation, we'd query an Activity collection in MongoDB

            const activities = [];

            const [recentSubscriptions, recentVAS, recentCommissions, coordinatorActions] = await Promise.all([
                SubscriptionSchema.find({}).sort({ updatedAt: -1 }).limit(5).lean(),
                VASSchema.find({}).sort({ createdAt: -1 }).limit(5).lean(),
                CommissionSchema.find({}).sort({ updatedAt: -1 }).limit(5).lean(),
                EventSchema.find({ 'approvalStatus.reviewedAt': { $exists: true } })
                    .sort({ 'approvalStatus.reviewedAt': -1 })
                    .limit(5)
                    .lean()
            ]);

            // Get recent user registrations
            const users = await User.getAllUsers();

            // Sort users by creation date, most recent first
            const sortedUsers = users.sort((a, b) => {
                const dateA = a.createdAt || a.joinedDate || new Date(0);
                const dateB = b.createdAt || b.joinedDate || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });

            // Add user registration activities
            sortedUsers.slice(0, Math.min(5, limit)).forEach(user => {
                activities.push({
                    type: 'registration',
                    timestamp: user.createdAt || user.joinedDate || new Date(),
                    user: {
                        id: user._id,
                        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                        role: user.role
                    },
                    description: `Registered as a new ${user.role}`,
                    route: `/admin/${user.role}s`
                });
            });

            // Get recent events
            const events = await Event.getAllEvents();

            // Sort events by creation date, most recent first
            const sortedEvents = events.sort((a, b) => {
                const dateA = a.created_at || new Date(0);
                const dateB = b.created_at || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });

            // Add event creation activities
            sortedEvents.slice(0, Math.min(5, limit)).forEach(event => {
                activities.push({
                    type: 'event_creation',
                    timestamp: event.created_at || new Date(),
                    user: event.organizer_id ? {
                        id: event.organizer_id,
                        name: event.organizer_name || 'Unknown Organizer',
                        role: 'organizer'
                    } : null,
                    description: `Created a new event: ${event.title || event.name || 'Unnamed Event'}`,
                    route: '/admin/events'
                });
            });

            // Get recent teams
            const teams = await Team.getAllTeams();

            // Sort teams by creation date, most recent first
            const sortedTeams = teams.sort((a, b) => {
                const dateA = a.created_at || new Date(0);
                const dateB = b.created_at || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });

            // Add team creation activities
            sortedTeams.slice(0, Math.min(5, limit)).forEach(team => {
                activities.push({
                    type: 'team_creation',
                    timestamp: team.created_at || new Date(),
                    user: team.manager_id ? {
                        id: team.manager_id,
                        name: team.manager_name || 'Unknown Manager',
                        role: 'manager'
                    } : null,
                    description: `Created a new team: ${team.name || 'Unnamed Team'}`,
                    route: '/admin/teams'
                });
            });

            recentSubscriptions.forEach((subscription) => {
                activities.push({
                    type: subscription.status === 'cancelled' ? 'subscription_cancelled' : 'subscription_purchase',
                    timestamp: subscription.updatedAt || subscription.createdAt,
                    user: null,
                    description: `Subscription ${subscription.plan} (${subscription.billingCycle}) is ${subscription.status}`,
                    route: '/admin/subscriptions'
                });
            });

            recentVAS.forEach((purchase) => {
                activities.push({
                    type: 'vas_purchase',
                    timestamp: purchase.createdAt,
                    user: null,
                    description: `VAS purchased: ${purchase.serviceType} (${purchase.serviceCategory})`,
                    route: '/admin/vas'
                });
            });

            recentCommissions.forEach((commission) => {
                activities.push({
                    type: commission.status === 'paid' ? 'payout_processed' : 'commission_update',
                    timestamp: commission.updatedAt || commission.createdAt,
                    user: null,
                    description: `Commission ${commission.status} | amount ${commission.commissionAmount || 0}`,
                    route: '/admin/commissions'
                });
            });

            coordinatorActions.forEach((event) => {
                activities.push({
                    type: 'coordinator_action',
                    timestamp: event.approvalStatus?.reviewedAt,
                    user: null,
                    description: `Coordinator reviewed event: ${event.title || 'Untitled event'}`,
                    route: '/admin/verification'
                });
            });

            // Sort all activities by timestamp, most recent first
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Return only the requested number of activities
            return activities.slice(0, limit);
        } catch (err) {
            console.error('Error getting recent activities:', err);
            // Return empty array instead of throwing to avoid breaking the UI
            return [];
        }
    },

    /**
     * Get upcoming events for admin dashboard
     * @param {number} limit - Maximum number of events to return
     * @returns {Promise<Array>} - Promise resolving to array of upcoming events
     */
    getUpcomingEvents: async function (limit = 5) {
        try {
            const upcomingEvents = await Event.getAllEvents({
                filter: {
                    event_date: { $gte: new Date() },
                    status: { $in: ['upcoming', 'in_progress'] }
                },
                sort: { event_date: 1 },
                limit: limit
            });

            // Format events with organizer info
            const formattedEvents = [];

            for (const event of upcomingEvents) {
                try {
                    // Get organizer details
                    let organizerName = 'Unknown Organizer';
                    if (event.organizer_id) {
                        const organizer = await User.getUserById(event.organizer_id);
                        if (organizer) {
                            organizerName = `${organizer.first_name || ''} ${organizer.last_name || ''}`.trim() || organizer.email.split('@')[0];
                        }
                    }

                    // Get team registrations count
                    const teamCount = event.team_registrations ? event.team_registrations.length : 0;
                    const maxTeams = event.max_teams || 'unlimited';

                    // Format event date
                    const eventDate = event.event_date ? new Date(event.event_date) : new Date();
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });

                    formattedEvents.push({
                        id: event._id,
                        title: event.title || 'Unnamed Event',
                        name: event.title || event.name || 'Unnamed Event',
                        date: formattedDate,
                        start_date: eventDate,
                        location: event.location || 'TBD',
                        teams: `${teamCount}/${maxTeams}`,
                        organizer: organizerName,
                        status: event.status === 'upcoming' ? 'Upcoming' : 'Active'
                    });
                } catch (err) {
                    console.error(`Error formatting event ${event._id}:`, err);
                }
            }

            return formattedEvents;
        } catch (err) {
            console.error('Error getting upcoming events:', err);
            return [];
        }
    },

    mapMatchForAdmin: function (match) {
        return {
            id: match._id,
            team1_name: match.team_a?.name || match.team_a_name || 'TBD',
            team2_name: match.team_b?.name || match.team_b_name || 'TBD',
            team1_score: mapScoreField(match, 'team_a_score', 'score_a'),
            team2_score: mapScoreField(match, 'team_b_score', 'score_b'),
            event_name: match.event_id?.title || match.event_id?.name || 'N/A',
            match_date: match.match_date,
            status: match.status || 'scheduled'
        };
    }
}; 