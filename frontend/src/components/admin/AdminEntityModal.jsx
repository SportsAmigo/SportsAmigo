/**
 * AdminEntityModal — Universal deep-linking detail modal with drill-down stack.
 *
 * Usage:
 *   <AdminEntityModal
 *     entityType="user" | "player" | "manager" | "organizer" | "coordinator" | "team" | "event" | "match"
 *     entityId={someId}
 *     entityName="Display Name"
 *     onClose={() => setOpen(false)}
 *   />
 *
 * Clicking any linked entity inside pushes to the navigation stack (breadcrumb drill-down).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

// ────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ────────────────────────────────────────────────────────────────────────────
const Tag = ({ label, color = 'gray' }) => {
    const map = {
        gray: 'bg-gray-100 text-gray-700',
        emerald: 'bg-emerald-100 text-emerald-700',
        blue: 'bg-blue-100 text-blue-700',
        red: 'bg-red-100 text-red-700',
        amber: 'bg-amber-100 text-amber-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        purple: 'bg-purple-100 text-purple-700',
        cyan: 'bg-cyan-100 text-cyan-700',
        teal: 'bg-teal-100 text-teal-700',
        rose: 'bg-rose-100 text-rose-700',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[color] || map.gray}`}>{label}</span>;
};

const InfoRow = ({ label, value }) => value != null && value !== '' && value !== 'N/A' ? (
    <div className="flex items-start gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase w-24 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-gray-800 font-medium break-words">{value}</span>
    </div>
) : null;

const Section = ({ title, icon, children, count, accent = 'indigo' }) => {
    const accentMap = {
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', iconColor: 'text-indigo-600', titleColor: 'text-indigo-800', badgeBg: 'bg-indigo-600' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconColor: 'text-blue-600', titleColor: 'text-blue-800', badgeBg: 'bg-blue-600' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconColor: 'text-emerald-600', titleColor: 'text-emerald-800', badgeBg: 'bg-emerald-600' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconColor: 'text-amber-600', titleColor: 'text-amber-800', badgeBg: 'bg-amber-600' },
        rose: { bg: 'bg-rose-50', border: 'border-rose-100', iconColor: 'text-rose-600', titleColor: 'text-rose-800', badgeBg: 'bg-rose-600' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconColor: 'text-purple-600', titleColor: 'text-purple-800', badgeBg: 'bg-purple-600' },
        cyan: { bg: 'bg-cyan-50', border: 'border-cyan-100', iconColor: 'text-cyan-600', titleColor: 'text-cyan-800', badgeBg: 'bg-cyan-600' },
        teal: { bg: 'bg-teal-50', border: 'border-teal-100', iconColor: 'text-teal-600', titleColor: 'text-teal-800', badgeBg: 'bg-teal-600' },
    };
    const a = accentMap[accent] || accentMap.indigo;
    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className={`flex items-center gap-2 px-4 py-3 ${a.bg} border-b ${a.border}`}>
                <i className={`fas ${icon} ${a.iconColor} text-sm`}></i>
                <span className={`font-bold ${a.titleColor} text-sm`}>{title}</span>
                {count != null && <span className={`ml-auto px-2 py-0.5 ${a.badgeBg} text-white rounded-full text-xs font-bold`}>{count}</span>}
            </div>
            <div className="p-3 space-y-2">{children}</div>
        </div>
    );
};

const EntityChip = ({ name, role, imageUrl, onClick, colorClass = 'bg-gray-50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200' }) => (
    <button onClick={onClick}
        className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left group ${colorClass}`}>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 overflow-hidden">
            {imageUrl
                ? <img src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`} alt={name} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                : (name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700">{name || 'Unknown'}</p>
            {role && <p className="text-xs text-gray-500 truncate capitalize">{role}</p>}
        </div>
        <i className="fas fa-chevron-right text-gray-300 group-hover:text-indigo-400 text-xs shrink-0"></i>
    </button>
);

// ────────────────────────────────────────────────────────────────────────────
// Config per entity type — endpoints must match admin.js routes exactly
// The router is mounted at /api/admin, so:
//   router.get('/api/users/:id')  → GET /api/admin/api/users/:id
// ────────────────────────────────────────────────────────────────────────────
const ENTITY_CONFIG = {
    user: { endpoint: id => `/api/admin/api/users/${id}`, headerGradient: 'from-indigo-600 to-purple-700', avatarColor: 'indigo', icon: 'fa-user' },
    player: { endpoint: id => `/api/admin/api/users/${id}`, headerGradient: 'from-indigo-500 to-blue-700', avatarColor: 'blue', icon: 'fa-running' },
    manager: { endpoint: id => `/api/admin/api/users/${id}`, headerGradient: 'from-emerald-600 to-teal-700', avatarColor: 'emerald', icon: 'fa-user-tie' },
    organizer: { endpoint: id => `/api/admin/api/users/${id}`, headerGradient: 'from-rose-600 to-pink-700', avatarColor: 'rose', icon: 'fa-user-shield' },
    coordinator: { endpoint: id => `/api/admin/api/users/${id}`, headerGradient: 'from-cyan-600 to-teal-700', avatarColor: 'cyan', icon: 'fa-user-check' },
    team: { endpoint: id => `/api/admin/api/teams/${id}`, headerGradient: 'from-blue-600 to-indigo-700', avatarColor: 'blue', icon: 'fa-users' },
    event: { endpoint: id => `/api/admin/api/events/${id}`, headerGradient: 'from-emerald-600 to-green-700', avatarColor: 'emerald', icon: 'fa-calendar-alt' },
    match: { endpoint: id => `/api/admin/api/matches/${id}`, headerGradient: 'from-amber-600 to-orange-700', avatarColor: 'amber', icon: 'fa-futbol' },
};

// ────────────────────────────────────────────────────────────────────────────
// Entity-specific renderers
// IMPORTANT: Field names must exactly match what adminController methods return.
// getUserDetailsById returns:
//   - players:  { teams:[{id,name,sport}], matches:[{id,team_a,team_b,score_a,score_b,status,date}], vas_purchases:[{service,amount}] }
//   - managers: { managed_teams:[{id,name,sport,members_count}], events:[{id,name,date,status}], matches:[{id,team_a,team_b,...}] }
//   - organizers: { events:[{id,name,date,status,location,teams}], subscription, vas_purchases, commissions:[{event,amount,payout,status}] }
//   - coordinators: { reviewed_events:[{id,name,status}], reviewed_organizers:[{id,name,email,status}] }
// getTeamDetailsById: { name, sport_type, manager:{id,name,email}, members:[{id,name,player_id,position}], events:[{id,title,status}], matches:[{id,team1_name,team2_name,team1_score,team2_score,status,match_date}] }
// getEventDetailsById: { title, sport_type, organizer:{id,name,email}, teams:[{id,name,manager_name,members}], matches:[{id,team1_name,team2_name,team1_score,team2_score,status}] }
// getMatchDetailsById: { team1_id, team1_name, team2_id, team2_name, team1_score, team2_score, event_id, event_name, organizer_id, organizer_name, match_date, venue, status }
// ────────────────────────────────────────────────────────────────────────────

const renderUserBody = (data, push) => {
    const role = (data?.role || '').toLowerCase() || 'player';
    const d = data?.details || {};
    const imageUrl = data?.profile_image;

    // Normalize teams: players have data.teams [{id,name,sport}]
    //                  managers have data.managed_teams [{id,name,sport,members_count}]
    const rawTeams = (data?.teams && data.teams.length > 0) ? data.teams
        : (data?.managed_teams && data.managed_teams.length > 0) ? data.managed_teams : [];
    const teamsList = rawTeams.map(t => ({
        id: t.id || t._id,
        name: t.name,
        sport: t.sport || t.sport_type,
        members: t.members_count || t.members || 0,
    }));

    // Normalize events: [{id,name,date,status,location,teams}]
    const eventsList = (data?.events || []).map(e => ({
        id: e.id || e._id,
        title: e.title || e.name,
        sport_type: e.sport_type || '',
        status: e.status,
    }));

    // Normalize matches: controller returns {id,team_a,team_b,score_a,score_b,status,date}
    const matchesList = (data?.matches || []).map(m => ({
        id: m.id || m._id,
        team1_name: m.team1_name || m.team_a || 'Team A',
        team2_name: m.team2_name || m.team_b || 'Team B',
        team1_score: m.team1_score ?? m.score_a ?? null,
        team2_score: m.team2_score ?? m.score_b ?? null,
        status: m.status,
        match_date: m.match_date || m.date,
        event_name: m.event_name || m.event || null,
    }));

    const displaySport = d.preferred_sports
        ? (Array.isArray(d.preferred_sports) ? d.preferred_sports.join(', ') : d.preferred_sports)
        : (d.sport_type || d.preferredSport || null);

    return (
        <div className="space-y-4">
            {/* Profile header */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xl border-4 border-white shadow shrink-0">
                    {imageUrl
                        ? <img src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`} alt={data.name} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                        : (data.name || '?')[0].toUpperCase()}
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-lg">{data.name}</p>
                    <p className="text-gray-500 text-sm">{data.email}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                        <Tag label={role.charAt(0).toUpperCase() + role.slice(1)} color="indigo" />
                        {d.verificationStatus && <Tag label={d.verificationStatus} color={d.verificationStatus === 'verified' ? 'emerald' : 'amber'} />}
                        {d.tier && <Tag label={`Tier ${d.tier}`} color="purple" />}
                    </div>
                </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Phone" value={data.phone} />
                <InfoRow label="Joined" value={data.created_at ? new Date(data.created_at).toLocaleDateString() : null} />
                <InfoRow label="Organization" value={data.organization || d.organization_name} />
                <InfoRow label="Sport" value={displaySport} />
                <InfoRow label="Region" value={d.region} />
                <InfoRow label="Category" value={d.category} />
                <InfoRow label="Age" value={d.age} />
                <InfoRow label="Address" value={d.address} />
            </div>

            {/* Teams */}
            {teamsList.length > 0 && (
                <Section title={role === 'manager' ? 'Managed Teams' : 'Teams'} icon="fa-users" count={teamsList.length} accent="blue">
                    {teamsList.map((t, i) => (
                        <EntityChip key={i} name={t.name}
                            role={`${t.sport || 'Sport'} • ${t.members} members`}
                            onClick={() => push('team', t.id, t.name)}
                            colorClass="bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300" />
                    ))}
                </Section>
            )}

            {/* Events */}
            {eventsList.length > 0 && (
                <Section title="Events" icon="fa-calendar-alt" count={eventsList.length} accent="emerald">
                    {eventsList.map((e, i) => (
                        <EntityChip key={i} name={e.title}
                            role={`${e.sport_type || ''} ${e.status ? '• ' + e.status : ''}`}
                            onClick={() => push('event', e.id, e.title)}
                            colorClass="bg-emerald-50 border-emerald-200 hover:bg-emerald-100" />
                    ))}
                </Section>
            )}

            {/* Matches */}
            {matchesList.length > 0 && (
                <Section title="Recent Matches" icon="fa-futbol" count={matchesList.length} accent="amber">
                    {matchesList.slice(0, 6).map((m, i) => (
                        <EntityChip key={i}
                            name={`${m.team1_name} vs ${m.team2_name}`}
                            role={`${m.status || 'Scheduled'}${m.match_date ? ' • ' + new Date(m.match_date).toLocaleDateString() : ''}${m.team1_score != null ? ' • ' + m.team1_score + '–' + m.team2_score : ''}`}
                            onClick={() => push('match', m.id, `${m.team1_name} vs ${m.team2_name}`)}
                            colorClass="bg-amber-50 border-amber-200 hover:bg-amber-100" />
                    ))}
                </Section>
            )}

            {/* VAS Purchases */}
            {data.vas_purchases && data.vas_purchases.length > 0 && (
                <Section title="VAS Purchases" icon="fa-gem" count={data.vas_purchases.length} accent="purple">
                    {data.vas_purchases.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                            <span className="text-sm text-gray-800">{v.service || v.service_name || v.serviceType}</span>
                            <span className="text-xs text-purple-600 font-semibold">${v.amount || v.price}</span>
                        </div>
                    ))}
                </Section>
            )}

            {/* Commissions (organizers) */}
            {data.commissions && data.commissions.length > 0 && (
                <Section title="Commission History" icon="fa-hand-holding-usd" count={data.commissions.length} accent="indigo">
                    {data.commissions.slice(0, 5).map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                            <span className="text-sm text-gray-800">{c.event || c.event_name || 'Event'}</span>
                            <span className="text-xs text-indigo-600 font-semibold">${c.amount || c.commissionAmount || c.payout || 0}</span>
                        </div>
                    ))}
                </Section>
            )}

            {/* Coordinator: Reviewed Events */}
            {data.reviewed_events && data.reviewed_events.length > 0 && (
                <Section title="Reviewed Events" icon="fa-clipboard-check" count={data.reviewed_events.length} accent="cyan">
                    {data.reviewed_events.slice(0, 6).map((e, i) => (
                        <EntityChip key={i} name={e.name || e.title} role={e.status}
                            onClick={() => push('event', e.id || e._id, e.name || e.title)}
                            colorClass="bg-cyan-50 border-cyan-200 hover:bg-cyan-100" />
                    ))}
                </Section>
            )}

            {/* Coordinator: Verified Organizers */}
            {data.reviewed_organizers && data.reviewed_organizers.length > 0 && (
                <Section title="Verified Organizers" icon="fa-user-shield" count={data.reviewed_organizers.length} accent="teal">
                    {data.reviewed_organizers.slice(0, 6).map((o, i) => (
                        <EntityChip key={i} name={o.name} role={o.email || o.status}
                            onClick={() => push('organizer', o.id || o._id, o.name)}
                            colorClass="bg-teal-50 border-teal-200 hover:bg-teal-100" />
                    ))}
                </Section>
            )}

            {/* Subscription */}
            {data.subscription && (
                <Section title="Subscription" icon="fa-id-card" accent="indigo">
                    <InfoRow label="Plan" value={data.subscription.plan_name || data.subscription.plan} />
                    <InfoRow label="Status" value={data.subscription.status} />
                    <InfoRow label="Billing" value={data.subscription.billing || data.subscription.billingCycle} />
                    <InfoRow label="Expires" value={data.subscription.endDate || data.subscription.expires_at ? new Date(data.subscription.endDate || data.subscription.expires_at).toLocaleDateString() : null} />
                </Section>
            )}
        </div>
    );
};

const renderTeamBody = (data, push) => (
    <div className="space-y-4">
        {/* Team header */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl border-4 border-white shadow shrink-0">
                {(data.name || '?')[0].toUpperCase()}
            </div>
            <div>
                <p className="font-bold text-gray-900 text-lg">{data.name}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                    <Tag label={data.sport_type || 'Sport'} color="blue" />
                    <Tag label={`${data.current_members || 0} members`} color="gray" />
                    {data.status && <Tag label={data.status} color={data.status === 'active' ? 'emerald' : 'red'} />}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Created" value={data.createdAt ? new Date(data.createdAt).toLocaleDateString() : null} />
            <InfoRow label="Max Members" value={data.max_members} />
            <InfoRow label="Location" value={data.location} />
        </div>
        {data.description && <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700">{data.description}</div>}

        {/* Manager — clickable */}
        {(data.manager_name || data.manager) && (
            <Section title="Manager" icon="fa-user-tie" accent="emerald">
                <EntityChip
                    name={data.manager_name || data.manager?.name}
                    role={`Manager • ${data.manager?.email || ''}`}
                    imageUrl={data.manager?.profile_image}
                    onClick={() => { const mgr = data.manager; if (mgr?.id) push('manager', mgr.id, mgr.name || data.manager_name); }}
                    colorClass="bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                />
            </Section>
        )}

        {/* Members — each clickable → player profile */}
        {data.members && data.members.length > 0 && (
            <Section title="Team Members" icon="fa-users" count={data.members.length} accent="blue">
                {data.members.map((m, i) => (
                    <EntityChip key={i}
                        name={m.name || m.player_name || 'Player'}
                        role={`Player${m.position ? ' • ' + m.position : ''}`}
                        imageUrl={m.profile_image}
                        onClick={() => push('player', m.id || m.player_id || m._id, m.name || m.player_name)}
                        colorClass="bg-blue-50 border-blue-200 hover:bg-blue-100"
                    />
                ))}
            </Section>
        )}

        {/* Matches */}
        {data.matches && data.matches.length > 0 && (
            <Section title="Match History" icon="fa-futbol" count={data.matches.length} accent="amber">
                {data.matches.slice(0, 6).map((m, i) => {
                    const isTeam1 = String(m.team1_id) === String(data.id);
                    const opponent = isTeam1 ? m.team2_name : m.team1_name;
                    return (
                        <EntityChip key={i}
                            name={`vs ${opponent || 'Opponent'}`}
                            role={`${m.status || 'Scheduled'}${m.match_date ? ' • ' + new Date(m.match_date).toLocaleDateString() : ''}${m.team1_score != null ? ' • ' + m.team1_score + '–' + m.team2_score : ''}`}
                            onClick={() => push('match', m.id || m._id, `${data.name} vs ${opponent}`)}
                            colorClass="bg-amber-50 border-amber-200 hover:bg-amber-100"
                        />
                    );
                })}
            </Section>
        )}

        {/* Events this team participated in */}
        {data.events && data.events.length > 0 && (
            <Section title="Events Participated" icon="fa-calendar-alt" count={data.events.length} accent="emerald">
                {data.events.map((e, i) => (
                    <EntityChip key={i} name={e.title || e.name} role={e.status}
                        onClick={() => push('event', e.id || e._id, e.title || e.name)}
                        colorClass="bg-emerald-50 border-emerald-200 hover:bg-emerald-100" />
                ))}
            </Section>
        )}
    </div>
);

const renderEventBody = (data, push) => (
    <div className="space-y-4">
        {/* Event header */}
        <div className="p-4 bg-gray-50 rounded-xl">
            <p className="font-bold text-gray-900 text-lg">{data.title || data.name}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
                <Tag label={data.sport_type || data.category || 'Sport'} color="emerald" />
                <Tag label={data.status || 'Active'} color={data.status === 'completed' ? 'gray' : data.status === 'cancelled' ? 'red' : 'emerald'} />
                {data.is_paid && <Tag label="PAID" color="amber" />}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Date" value={data.event_date ? new Date(data.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
            <InfoRow label="Location" value={data.location} />
            <InfoRow label="Max Teams" value={data.max_teams} />
            <InfoRow label="Reg. Fee" value={data.registration_fee ? `$${data.registration_fee}` : null} />
            <InfoRow label="Commission %" value={data.commission_rate ? `${data.commission_rate}%` : null} />
        </div>

        {data.description && <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700">{data.description}</div>}

        {/* Organizer — clickable */}
        {(data.organizer_name || data.organizer) && (
            <Section title="Organizer" icon="fa-user-shield" accent="rose">
                <EntityChip
                    name={data.organizer_name || data.organizer?.name}
                    role={`Organizer • ${data.organizer?.email || ''}`}
                    imageUrl={data.organizer?.profile_image}
                    onClick={() => {
                        const org = data.organizer;
                        const orgId = org?.id || org?._id || data.organizer_id;
                        const orgName = org?.name || data.organizer_name;
                        if (orgId) push('organizer', orgId, orgName);
                    }}
                    colorClass="bg-rose-50 border-rose-200 hover:bg-rose-100"
                />
            </Section>
        )}

        {/* 🏆 Winner Banner — only shown for completed events with a recorded winner */}
        {data.status === 'completed' && (data.winner || data.winning_team_id) && (
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-3xl">🏆</span>
                </div>
                <div>
                    <p className="text-xs font-bold text-yellow-900/70 uppercase tracking-wide">Champion</p>
                    <p className="text-xl font-black text-white drop-shadow">{data.winner}</p>
                    {data.winning_team_id && (
                        <button
                            onClick={() => push('team', String(data.winning_team_id), data.winner)}
                            className="mt-1 text-xs text-white/80 hover:text-white underline underline-offset-2 transition-colors">
                            View team details →
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Teams — each clickable → team detail (members + manager). Winner team highlighted in amber */}
        {data.teams && data.teams.length > 0 && (
            <Section title="Participating Teams" icon="fa-users" count={data.teams.length} accent="blue">
                {data.teams.map((t, i) => {
                    const isWinner = data.winner && (t.name === data.winner || String(t.id || t._id) === String(data.winning_team_id));
                    return (
                        <div key={i} className="relative">
                            {isWinner && (
                                <span className="absolute top-1 right-8 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full z-10 pointer-events-none">🏆 Winner</span>
                            )}
                            <EntityChip
                                name={t.name}
                                role={`${t.sport_type || ''} • ${t.members || t.current_members || 0} members • Manager: ${t.manager_name || 'N/A'}`}
                                onClick={() => push('team', t.id || t._id, t.name)}
                                colorClass={isWinner ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 hover:border-amber-400' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}
                            />
                        </div>
                    );
                })}
            </Section>
        )}

        {/* Matches — scoreboard style */}
        {data.matches && data.matches.length > 0 && (
            <Section title="Matches" icon="fa-futbol" count={data.matches.length} accent="amber">
                {data.matches.map((m, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                        <button onClick={() => push('match', m.id || m._id, `${m.team1_name} vs ${m.team2_name}`)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-amber-50 transition-all group text-left">
                            <div className="flex-1 text-center">
                                <p className="text-sm font-semibold text-gray-800">{m.team1_name || 'Team A'}</p>
                            </div>
                            <div className="text-center px-3">
                                {m.team1_score != null && m.team2_score != null
                                    ? <span className="font-black text-lg text-gray-800">{m.team1_score}<span className="text-gray-400 mx-1">–</span>{m.team2_score}</span>
                                    : <span className="text-gray-400 font-bold text-sm">vs</span>}
                                <p className={`text-xs mt-0.5 font-semibold ${m.status === 'completed' ? 'text-emerald-600' : m.status === 'in_progress' ? 'text-orange-600' : 'text-blue-600'}`}>{m.status || 'Scheduled'}</p>
                            </div>
                            <div className="flex-1 text-center">
                                <p className="text-sm font-semibold text-gray-800">{m.team2_name || 'Team B'}</p>
                            </div>
                            <i className="fas fa-chevron-right text-gray-300 group-hover:text-amber-400 text-xs"></i>
                        </button>
                    </div>
                ))}
            </Section>
        )}
    </div>
);

const renderMatchBody = (data, push) => {
    const hasScore = data.team1_score != null && data.team2_score != null;
    return (
        <div className="space-y-4">
            {/* Scoreboard */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-5">
                <div className="flex items-center justify-between">
                    <button onClick={() => data.team1_id && push('team', data.team1_id, data.team1_name)}
                        className="flex-1 text-center hover:bg-white/10 rounded-xl p-3 transition-all group">
                        <p className="text-xs text-white/60 mb-1">Team A</p>
                        <p className="text-lg font-bold group-hover:text-amber-300 transition-colors">{data.team1_name || 'Team A'}</p>
                        {data.team1_manager && <p className="text-xs text-white/50 mt-1">Mgr: {data.team1_manager}</p>}
                        {data.team1_id && <p className="text-xs text-white/40 mt-1 group-hover:text-white/60">Click to view ↗</p>}
                    </button>
                    <div className="text-center px-4">
                        {hasScore
                            ? <p className="text-5xl font-black text-white">{data.team1_score}<span className="text-white/40 text-3xl mx-2">–</span>{data.team2_score}</p>
                            : <p className="text-3xl font-bold text-white/40">vs</p>}
                        <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${data.status === 'completed' ? 'bg-emerald-500' : data.status === 'in_progress' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                            {(data.status || 'Scheduled').replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <button onClick={() => data.team2_id && push('team', data.team2_id, data.team2_name)}
                        className="flex-1 text-center hover:bg-white/10 rounded-xl p-3 transition-all group">
                        <p className="text-xs text-white/60 mb-1">Team B</p>
                        <p className="text-lg font-bold group-hover:text-amber-300 transition-colors">{data.team2_name || 'Team B'}</p>
                        {data.team2_manager && <p className="text-xs text-white/50 mt-1">Mgr: {data.team2_manager}</p>}
                        {data.team2_id && <p className="text-xs text-white/40 mt-1 group-hover:text-white/60">Click to view ↗</p>}
                    </button>
                </div>
                {data.winner && <p className="text-center text-emerald-400 text-sm font-bold mt-3">🏆 Winner: {data.winner}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Date" value={data.match_date ? new Date(data.match_date).toLocaleDateString() : null} />
                <InfoRow label="Venue" value={data.venue} />
                <InfoRow label="Sport" value={data.sport_type} />
            </div>

            {data.notes && <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-200"><strong className="text-gray-500 block mb-1 text-xs">Notes:</strong>{data.notes}</div>}

            {/* Link to Event */}
            {(data.event_id || data.event_name) && (
                <Section title="Event" icon="fa-calendar-alt" accent="emerald">
                    <EntityChip name={data.event_name || 'View Event'} role={data.sport_type}
                        onClick={() => { if (data.event_id) push('event', data.event_id, data.event_name); }}
                        colorClass="bg-emerald-50 border-emerald-200 hover:bg-emerald-100" />
                </Section>
            )}

            {/* Organizer */}
            {(data.organizer_name || data.organizer_id) && (
                <Section title="Organized By" icon="fa-user-shield" accent="rose">
                    <EntityChip name={data.organizer_name || 'Organizer'} role="Organizer"
                        onClick={() => { if (data.organizer_id) push('organizer', data.organizer_id, data.organizer_name); }}
                        colorClass="bg-rose-50 border-rose-200 hover:bg-rose-100" />
                </Section>
            )}

            {/* Teams with managers */}
            {(data.team1_id || data.team2_id) && (
                <Section title="Teams" icon="fa-users" accent="blue">
                    {data.team1_id && (
                        <EntityChip name={data.team1_name} role={`Manager: ${data.team1_manager || 'N/A'}`}
                            onClick={() => push('team', data.team1_id, data.team1_name)}
                            colorClass="bg-blue-50 border-blue-200 hover:bg-blue-100" />
                    )}
                    {data.team2_id && (
                        <EntityChip name={data.team2_name} role={`Manager: ${data.team2_manager || 'N/A'}`}
                            onClick={() => push('team', data.team2_id, data.team2_name)}
                            colorClass="bg-blue-50 border-blue-200 hover:bg-blue-100" />
                    )}
                </Section>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
// Main AdminEntityModal component
// ────────────────────────────────────────────────────────────────────────────
const AdminEntityModal = ({ entityType, entityId, entityName, onClose }) => {
    const [stack, setStack] = useState([{ type: entityType, id: entityId, name: entityName }]);
    const [dataCache, setDataCache] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const bodyRef = useRef(null);

    const current = stack[stack.length - 1];
    const cacheKey = `${current.type}:${current.id}`;
    const currentData = dataCache[cacheKey];

    const fetchEntity = useCallback(async (type, id) => {
        const key = `${type}:${id}`;
        if (dataCache[key]) return;
        const config = ENTITY_CONFIG[type] || ENTITY_CONFIG.user;
        if (!config) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}${config.endpoint(id)}`, { withCredentials: true });
            if (res.data.success) {
                const payload = res.data.data || res.data.user || res.data.team || res.data.event || res.data.match || res.data;
                setDataCache(prev => ({ ...prev, [key]: payload }));
            } else {
                setError(res.data.message || 'Could not load details.');
            }
        } catch (e) {
            setError(e.response?.data?.message || `Failed to fetch ${type} details.`);
            console.error(`[AdminEntityModal] Error fetching ${type} ${id}:`, e.response?.data || e.message);
        } finally {
            setLoading(false);
        }
    }, [dataCache]);

    useEffect(() => {
        if (current.id) fetchEntity(current.type, current.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current.type, current.id]);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }, [stack.length]);

    const pushEntity = (type, id, name) => {
        if (!id) return;
        setStack(prev => [...prev, { type, id: String(id), name }]);
    };

    const popEntity = () => setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    const jumpToIndex = (idx) => setStack(prev => prev.slice(0, idx + 1));

    const config = ENTITY_CONFIG[current.type] || ENTITY_CONFIG.user;

    const renderBody = () => {
        if (!currentData) return null;
        switch (current.type) {
            case 'team': return renderTeamBody(currentData, pushEntity);
            case 'event': return renderEventBody(currentData, pushEntity);
            case 'match': return renderMatchBody(currentData, pushEntity);
            default: return renderUserBody(currentData, pushEntity);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
                style={{ animation: 'slideUpFade 0.25s ease-out' }}
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={`bg-gradient-to-r ${config.headerGradient} text-white rounded-t-2xl p-5 shrink-0`}>
                    {/* Breadcrumbs */}
                    {stack.length > 1 && (
                        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                            {stack.map((s, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <i className="fas fa-chevron-right text-white/40 text-xs shrink-0"></i>}
                                    <button
                                        onClick={() => jumpToIndex(i)}
                                        className={`text-xs px-2 py-0.5 rounded whitespace-nowrap transition-colors ${i === stack.length - 1 ? 'bg-white/20 text-white font-semibold' : 'text-white/60 hover:text-white'}`}>
                                        {s.name || s.type}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        {stack.length > 1 && (
                            <button onClick={popEntity} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 shrink-0">
                                <i className="fas fa-arrow-left text-sm"></i>
                            </button>
                        )}
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl shrink-0">
                            <i className={`fas ${config.icon}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/60 uppercase font-semibold">{current.type}</p>
                            <p className="text-xl font-bold truncate">{currentData?.name || currentData?.title || current.name || '...'}</p>
                            {currentData?.email && <p className="text-sm text-white/70 truncate">{currentData.email}</p>}
                        </div>
                        <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 shrink-0">
                            <i className="fas fa-times text-sm"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-3"></i>
                            <p className="text-gray-500 text-sm">Loading {current.type} details...</p>
                        </div>
                    )}
                    {!loading && error && (
                        <div className="p-4 bg-red-50 rounded-xl text-red-600 text-sm text-center">
                            <i className="fas fa-exclamation-circle mr-2"></i>{error}
                        </div>
                    )}
                    {!loading && !error && renderBody()}
                </div>
            </div>

            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AdminEntityModal;
