import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import './ScheduleMatches.css';
import '../manager/ManagerDashboard.css';

const ScheduleMatches = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schedulingType, setSchedulingType] = useState('round-robin');
    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState('');
    const [scheduleFinalized, setScheduleFinalized] = useState(false);
    const [existingMatchCount, setExistingMatchCount] = useState(0);

    useEffect(() => {
        fetchEventDetails();
        checkExistingMatches();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            console.log('🔍 Fetching event:', eventId);
            
            const response = await axios.get(
                `http://localhost:5000/api/organizer/event/${eventId}`,
                { withCredentials: true }
            );

            console.log('📥 Event response:', response.data);

            if (response.data.success) {
                const eventData = response.data.event;
                setEvent(eventData);
                setScheduleFinalized(eventData.schedule_finalized || false);

                console.log('🎯 Event data:', eventData);
                console.log('🔒 Schedule finalized:', eventData.schedule_finalized);
                console.log('👥 Team registrations:', eventData.team_registrations);

                // Extract teams that are approved or confirmed
                let approvedTeams = [];
                
                if (eventData.team_registrations && eventData.team_registrations.length > 0) {
                    approvedTeams = eventData.team_registrations
                        .filter(reg => {
                            const isApproved = reg.status === 'approved' || reg.status === 'confirmed';
                            console.log('Team registration:', {
                                team_name: reg.team_name,
                                status: reg.status,
                                isApproved: isApproved,
                                team_id: reg.team_id
                            });
                            return isApproved;
                        })
                        .map(reg => {
                            // Handle both populated and non-populated team_id
                            const teamData = reg.team_id;
                            if (typeof teamData === 'object' && teamData !== null) {
                                return {
                                    id: teamData._id || teamData.id,
                                    name: teamData.name || reg.team_name
                                };
                            } else if (teamData) {
                                // If team_id is just a string ID, use team_name from registration
                                return {
                                    id: teamData,
                                    name: reg.team_name
                                };
                            }
                            return null;
                        })
                        .filter(team => team !== null);
                }
                
                console.log('✅ Approved teams for scheduling:', approvedTeams);
                setTeams(approvedTeams);

                if (approvedTeams.length === 0) {
                    console.warn('⚠️ No approved/confirmed teams found!');
                } else {
                    console.log(`✅ Found ${approvedTeams.length} approved teams`);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching event details:', error);
            console.error('Error response:', error.response?.data);
            alert('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const checkExistingMatches = async () => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/matches/event/${eventId}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setExistingMatchCount(response.data.matches?.length || 0);
            }
        } catch (error) {
            console.error('Error checking matches:', error);
        }
    };

    const finalizeSchedule = async () => {
        if (!window.confirm(
            '🔒 FINALIZE SCHEDULE\n\n' +
            'This will LOCK the schedule permanently.\n' +
            'You will NOT be able to:\n' +
            '• Re-generate fixtures\n' +
            '• Modify match dates/times\n' +
            '• Add/remove matches\n\n' +
            'Are you sure you want to finalize?'
        )) {
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/organizer/event/${eventId}/finalize-schedule`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('✅ Schedule finalized successfully!\n\nMatches are now locked.');
                setScheduleFinalized(true);
                navigate(`/organizer/event/${eventId}/matches`);
            }
        } catch (error) {
            console.error('Error finalizing schedule:', error);
            alert(error.response?.data?.message || 'Failed to finalize schedule');
        }
    };

    const generateRoundRobin = () => {
        if (teams.length < 2) {
            alert('Need at least 2 teams to generate fixtures');
            return;
        }

        const fixtures = [];
        const roundsArray = []; // ✅ Create new array
        const n = teams.length;
        let matchNumber = 1;

        console.log('Generating Round Robin for', n, 'teams'); // Debug

        // If odd number of teams, add a "bye" team
        const teamsArray = [...teams];
        if (n % 2 === 1) {
            teamsArray.push({ id: 'bye', name: 'BYE' });
        }

        const totalTeams = teamsArray.length;
        const totalRounds = totalTeams - 1;

        // Generate fixtures for each round
        for (let round = 0; round < totalRounds; round++) {
            const roundMatches = [];

            for (let i = 0; i < totalTeams / 2; i++) {
                const home = teamsArray[i];
                const away = teamsArray[totalTeams - 1 - i];

                // Skip if one team is BYE
                if (home.id !== 'bye' && away.id !== 'bye') {
                    // Initialize with today + round offset
                    const defaultDate = new Date();
                    defaultDate.setDate(defaultDate.getDate() + round);
                    const dateStr = defaultDate.toISOString().split('T')[0];
                    
                    roundMatches.push({
                        match_number: matchNumber++,
                        team_a: home.id,
                        team_a_name: home.name,
                        team_b: away.id,
                        team_b_name: away.name,
                        round: `Round ${round + 1}`,
                        match_date: `${dateStr}T10:00`, // Default time 10:00 AM
                        venue: event?.location || ''
                    });
                }
            }

            // Rotate teams (keep first team fixed)
            const lastTeam = teamsArray.pop();
            teamsArray.splice(1, 0, lastTeam);

            if (roundMatches.length > 0) {
                roundsArray.push({ // ✅ Push to local array
                    name: `Round ${round + 1}`,
                    matches: roundMatches
                });
                fixtures.push(...roundMatches);
            }
        }

        console.log('Generated fixtures:', fixtures); // Debug
        console.log('Generated rounds:', roundsArray); // Debug

        setRounds(roundsArray); // ✅ Update state once
        setMatches(fixtures);
        setSelectedRound(roundsArray[0]?.name || '');
    };

    const generateKnockout = () => {
        if (teams.length < 2) {
            alert('Need at least 2 teams to generate fixtures');
            return;
        }

        const fixtures = [];
        const roundsArray = [];
        const roundNames = ['Final', 'Semi Final', 'Quarter Final', 'Round of 16', 'Round of 32'];
        let matchNumber = 1;

        // Calculate nearest power of 2 (downward)
        const teamCount = teams.length;
        const nearestPowerOf2 = Math.pow(2, Math.floor(Math.log2(teamCount)));
        
        console.log(`🏆 Knockout Generation: ${teamCount} teams → Using ${nearestPowerOf2} teams in bracket`);

        // Select top N teams for bracket (where N is power of 2)
        let knockoutTeams = [...teams].slice(0, nearestPowerOf2);
        
        // Shuffle teams for fair draw
        knockoutTeams.sort(() => Math.random() - 0.5);

        // Calculate round name index based on bracket size
        const totalRounds = Math.log2(nearestPowerOf2);
        let roundIndex = totalRounds - 1; // Start from largest round (e.g., Semi Final for 4 teams)

        let currentRound = [];

        // Generate first round matches
        for (let i = 0; i < knockoutTeams.length; i += 2) {
            if (i + 1 < knockoutTeams.length) {
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + Math.floor(i / 2));
                const dateStr = defaultDate.toISOString().split('T')[0];
                
                currentRound.push({
                    match_number: matchNumber++,
                    team_a: knockoutTeams[i].id,
                    team_a_name: knockoutTeams[i].name,
                    team_b: knockoutTeams[i + 1].id,
                    team_b_name: knockoutTeams[i + 1].name,
                    round: roundNames[roundIndex] || `Round ${roundIndex + 1}`,
                    match_date: `${dateStr}T14:00`,
                    venue: event?.location || ''
                });
            }
        }

        fixtures.push(...currentRound);
        roundsArray.push({
            name: roundNames[roundIndex] || `Round ${roundIndex + 1}`,
            matches: currentRound
        });

        // Show warning if teams were excluded
        if (teamCount > nearestPowerOf2) {
            const excludedCount = teamCount - nearestPowerOf2;
            alert(
                `⚠️ Knockout Format Adjustment\n\n` +
                `${teamCount} teams registered, but knockout requires power-of-2.\n` +
                `Using ${nearestPowerOf2} teams in bracket.\n` +
                `${excludedCount} team(s) excluded from fixtures.`
            );
        }

        console.log('Generated knockout fixtures:', fixtures);
        console.log('Generated rounds:', roundsArray);

        setRounds(roundsArray);
        setMatches(fixtures);
        setSelectedRound(roundsArray[0]?.name || '');
    };

    const handleDateChange = (matchNumber, date) => {
        console.log(`🔄 Updating match #${matchNumber} with date: ${date}`);
        setMatches(prevMatches => {
            const updated = prevMatches.map(match =>
                match.match_number === matchNumber
                    ? { ...match, match_date: date }
                    : match
            );
            console.log('Updated matches:', updated);
            return updated;
        });
    };

    const handleVenueChange = (matchNumber, venue) => {
        setMatches(prevMatches => prevMatches.map(match =>
            match.match_number === matchNumber
                ? { ...match, venue }
                : match
        ));
    };

    const scheduleMatches = async () => {
        try {
            console.log('\n=== SCHEDULING MATCHES ===');
            console.log('Total matches:', matches.length);
            
            // Validate all matches have complete datetime (date + time)
            const invalidMatches = matches.filter(m => {
                const hasValidDateTime = m.match_date && 
                                        m.match_date !== '' && 
                                        m.match_date.includes('T') &&
                                        m.match_date.length >= 16 && // YYYY-MM-DDTHH:MM
                                        !m.match_date.includes('--:--');
                
                if (!hasValidDateTime) {
                    console.log(`❌ Match ${m.match_number}: Invalid datetime='${m.match_date}'`);
                } else {
                    console.log(`✅ Match ${m.match_number}: datetime='${m.match_date}'`);
                }
                
                return !hasValidDateTime;
            });
            
            if (invalidMatches.length > 0) {
                const matchNumbers = invalidMatches.map(m => `Match #${m.match_number}`).join(', ');
                console.error('Invalid matches found:', invalidMatches);
                alert(
                    `⚠️ INCOMPLETE DATE/TIME!\n\n` +
                    `${invalidMatches.length} match(es) need both DATE and TIME:\n` +
                    `${matchNumbers}\n\n` +
                    `📌 Please set both the date AND time for each match.`
                );
                return;
            }
            
            console.log('✅ All matches have complete date & time!');
            console.log('📤 Scheduling matches for event:', eventId);
            console.log('📊 Total matches:', matches.length);
            console.log('🏆 Matches data:', matches);

            const response = await axios.post(
                `http://localhost:5000/api/organizer/event/${eventId}/schedule-matches`,
                { matches },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Response:', response.data);

            if (response.data.success) {
                // Show success with finalization option
                const shouldFinalize = window.confirm(
                    `✅ Successfully scheduled ${response.data.matchesCreated} matches!\n\n` +
                    `📋 Next Step: FINALIZE SCHEDULE\n\n` +
                    `Would you like to FINALIZE the schedule now?\n\n` +
                    `⚠️ Finalizing will LOCK the schedule permanently.\n` +
                    `Click OK to finalize, or Cancel to review matches first.`
                );

                if (shouldFinalize) {
                    await finalizeSchedule();
                } else {
                    navigate(`/organizer/event/${eventId}/matches`);
                }
            } else {
                alert(`⚠️ ${response.data.message}`);
            }
        } catch (error) {
            console.error('❌ Error scheduling matches:', error);
            console.error('Error response:', error.response?.data);
            alert(error.response?.data?.message || 'Failed to schedule matches. Please try again.');
        }
    };

    const getCurrentRoundMatches = () => {
        if (!selectedRound) return matches;
        const round = rounds.find(r => r.name === selectedRound);
        return round ? round.matches : [];
    };

    if (loading) {
        return (
            <OrganizerLayout>
                <div className="schedule-matches-page">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading event details...</p>
                    </div>
                </div>
            </OrganizerLayout>
        );
    }

    return (
        <OrganizerLayout>
            <div className="schedule-matches-page">
                <div className="schedule-matches-container">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">
                            <i className="fas fa-calendar-plus"></i>
                            Schedule Matches
                        </h1>
                        <p className="page-subtitle">{event?.title}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/organizer/event/${eventId}/matches`)}
                        className="btn-back"
                    >
                        <i className="fas fa-arrow-left"></i>
                        Back to Matches
                    </button>
                </div>

                {scheduleFinalized ? (
                    <div className="schedule-locked">
                        <div className="lock-icon">🔒</div>
                        <h2>Schedule Finalized</h2>
                        <p>This event's schedule has been locked and cannot be modified.</p>
                        <div className="locked-info">
                            <span><i className="fas fa-calendar-check"></i> {existingMatchCount} matches scheduled</span>
                            <span><i className="fas fa-users"></i> {teams.length} teams confirmed</span>
                        </div>
                        <button 
                            onClick={() => navigate(`/organizer/event/${eventId}/matches`)}
                            className="btn-view-fixtures"
                        >
                            <i className="fas fa-eye"></i>
                            View Fixtures
                        </button>
                    </div>
                ) : teams.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-users-slash"></i>
                        <h3>No Confirmed Teams</h3>
                        <p>You need to approve team registrations before scheduling matches</p>
                        <button 
                            onClick={() => navigate(`/organizer/event/${eventId}/registrations`)}
                            className="btn-primary"
                            style={{ marginTop: '1rem' }}
                        >
                            Go to Registrations
                        </button>
                    </div>
                ) : (
                    <>
                        {existingMatchCount > 0 && (
                            <div className="warning-banner">
                                <i className="fas fa-info-circle"></i>
                                <span>{existingMatchCount} matches already created. Generate new fixtures will replace them.</span>
                            </div>
                        )}

                        <div className="scheduling-options">
                            <div className="teams-info">
                                <h3><i className="fas fa-users"></i> Confirmed Teams ({teams.length})</h3>
                                <div className="teams-list">
                                    {teams.map((team, index) => (
                                        <span key={team.id} className="team-badge">
                                            {index + 1}. {team.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="format-selector">
                                <h3><i className="fas fa-trophy"></i> Tournament Format</h3>
                                <div className="format-buttons">
                                    <button
                                        className={`format-btn ${schedulingType === 'round-robin' ? 'active' : ''}`}
                                        onClick={() => setSchedulingType('round-robin')}
                                    >
                                        <i className="fas fa-sync"></i>
                                        Round Robin
                                        <small>Everyone plays everyone</small>
                                    </button>
                                    <button
                                        className={`format-btn ${schedulingType === 'knockout' ? 'active' : ''}`}
                                        onClick={() => setSchedulingType('knockout')}
                                    >
                                        <i className="fas fa-trophy"></i>
                                        Knockout
                                        <small>Single elimination</small>
                                    </button>
                                </div>
                            </div>

                            <button
                                className="btn-generate"
                                onClick={schedulingType === 'round-robin' ? generateRoundRobin : generateKnockout}
                            >
                                <i className="fas fa-magic"></i>
                                Generate Fixtures
                            </button>
                        </div>

                        {matches.length > 0 && (
                            <div className="fixtures-section">
                                <div className="fixtures-header">
                                    <h3>
                                        <i className="fas fa-list-ol"></i>
                                        Generated Fixtures ({matches.length} matches)
                                    </h3>
                                    
                                    {rounds.length > 1 && (
                                        <div className="round-selector">
                                            <label>View Round:</label>
                                            <select
                                                value={selectedRound}
                                                onChange={(e) => setSelectedRound(e.target.value)}
                                                className="round-select"
                                            >
                                                <option value="">All Rounds</option>
                                                {rounds.map(round => (
                                                    <option key={round.name} value={round.name}>
                                                        {round.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="fixtures-list">
                                    {getCurrentRoundMatches().map((match) => (
                                        <div key={match.match_number} className="fixture-card">
                                            <div className="fixture-header">
                                                <span className="match-number">Match #{match.match_number}</span>
                                                <span className="match-round">{match.round}</span>
                                            </div>
                                            
                                            <div className="fixture-teams">
                                                <div className="team-name">{match.team_a_name}</div>
                                                <div className="vs">VS</div>
                                                <div className="team-name">{match.team_b_name}</div>
                                            </div>

                                            <div className="fixture-details">
                                                <div className="detail-group">
                                                    <label>
                                                        <i className="fas fa-calendar"></i>
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={match.match_date?.split('T')[0] || ''}
                                                        onChange={(e) => {
                                                            const currentTime = match.match_date?.split('T')[1]?.substring(0, 5) || '10:00';
                                                            handleDateChange(match.match_number, `${e.target.value}T${currentTime}`);
                                                        }}
                                                        className="detail-input"
                                                        min={new Date().toISOString().split('T')[0]}
                                                        required
                                                    />
                                                </div>
                                                <div className="detail-group">
                                                    <label>
                                                        <i className="fas fa-clock"></i>
                                                        Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={match.match_date?.split('T')[1]?.substring(0, 5) || '10:00'}
                                                        onChange={(e) => {
                                                            const currentDate = match.match_date?.split('T')[0] || new Date().toISOString().split('T')[0];
                                                            handleDateChange(match.match_number, `${currentDate}T${e.target.value}`);
                                                        }}
                                                        className="detail-input"
                                                        required
                                                    />
                                                </div>
                                                <div className="detail-group">
                                                    <label>
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        Venue
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={match.venue}
                                                        onChange={(e) => handleVenueChange(match.match_number, e.target.value)}
                                                        placeholder="Enter venue"
                                                        className="detail-input"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="action-buttons">
                                    <button
                                        onClick={() => {
                                            setMatches([]);
                                            setRounds([]);
                                            setSelectedRound('');
                                        }}
                                        className="btn-cancel"
                                    >
                                        <i className="fas fa-times"></i>
                                        Clear All
                                    </button>
                                    <button
                                        onClick={scheduleMatches}
                                        className="btn-schedule"
                                    >
                                        <i className="fas fa-check"></i>
                                        Schedule All Matches ({matches.length})
                                        </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
                </div>
            </div>
        </OrganizerLayout>
    );
};

export default ScheduleMatches;