import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ManagerLayout from '../../components/layout/ManagerLayout';
import './TeamMatches.css';

const TeamMatches = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingMatch, setEditingMatch] = useState(null);
    const [scores, setScores] = useState({ score_a: 0, score_b: 0 });

    useEffect(() => {
        fetchTeamAndMatches();
    }, [teamId]);

    const fetchTeamAndMatches = async () => {
        try {
            // Fetch team details
            const teamRes = await axios.get(
                `http://localhost:5000/api/matches/teams/${teamId}`,
                { withCredentials: true }
            );
            setTeam(teamRes.data.team);

            // Fetch team's matches
            const matchesRes = await axios.get(
                `http://localhost:5000/api/matches/team/${teamId}/all`,
                { withCredentials: true }
            );
            
            console.log('Matches:', matchesRes.data.matches);
            
            // Remove duplicates based on _id
            const uniqueMatches = matchesRes.data.matches ? 
                Array.from(new Map(matchesRes.data.matches.map(m => [m._id, m])).values()) : 
                [];
            
            setMatches(uniqueMatches);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const canUpdateMatch = (matchDate, status) => {
        // Cannot update if verified, completed or cancelled
        if (status === 'verified' || status === 'completed' || status === 'cancelled') {
            return false;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const match = new Date(matchDate);
        match.setHours(0, 0, 0, 0);
        
        // Can update if match date is today or in the past
        return match <= today;
    };

    const startEditing = (match) => {
        setEditingMatch(match._id);
        setScores({
            score_a: match.score_a || 0,
            score_b: match.score_b || 0
        });
    };

    const cancelEditing = () => {
        setEditingMatch(null);
        setScores({ score_a: 0, score_b: 0 });
    };

    const submitScore = async (matchId) => {
        try {
            const response = await axios.put(
                `http://localhost:5000/api/matches/${matchId}/result`,
                {
                    score_a: parseInt(scores.score_a),
                    score_b: parseInt(scores.score_b)
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                const msg = response.data.requiresApproval 
                    ? '✅ Result submitted for verification.\n\nWaiting for Organizer approval.'
                    : '✅ Match score recorded successfully!';
                alert(msg);
                setEditingMatch(null);
                fetchTeamAndMatches(); // Refresh list
            }
        } catch (error) {
            console.error('Error recording score:', error);
            alert(error.response?.data?.message || 'Failed to record score');
        }
    };

    const getMatchStatus = (match) => {
        // Priority: completed/cancelled first
        if (match.status === 'verified' || match.status === 'completed') {
            return { label: 'Completed', color: '#10b981', icon: '✅' };
        }
        if (match.status === 'pending') {
            return { label: 'Pending Approval', color: '#f59e0b', icon: '⏳' };
        }
        if (match.status === 'cancelled') {
            return { label: 'Cancelled', color: '#ef4444', icon: '❌' };
        }
        
        // For scheduled matches, check date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const matchDate = new Date(match.match_date);
        matchDate.setHours(0, 0, 0, 0);
        
        if (matchDate > today) {
            return { label: 'Upcoming', color: '#3b82f6', icon: '📅' };
        } else {
            return { label: 'Pending Result', color: '#f59e0b', icon: '⏳' };
        }
    };

    if (loading) {
        return (
            <ManagerLayout>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading matches...</p>
                </div>
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout>
            <div className="team-matches-container">
                <div className="page-header">
                    <button onClick={() => navigate(-1)} className="btn-back">
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                    <div>
                        <h1 className="page-title">Team Matches</h1>
                        <p className="page-subtitle">{team?.name}</p>
                    </div>
                </div>

                {matches.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🏏</span>
                        <h3>No Matches Scheduled</h3>
                        <p>Your team hasn't been scheduled for any matches yet</p>
                    </div>
                ) : (
                    <div className="matches-list">
                        {matches.map((match) => {
                            const status = getMatchStatus(match);
                            const isTeamA = match.team_a._id === teamId || match.team_a === teamId;
                            const yourTeam = isTeamA ? match.team_a_name : match.team_b_name;
                            const opponentTeam = isTeamA ? match.team_b_name : match.team_a_name;
                            const yourScore = isTeamA ? match.score_a : match.score_b;
                            const opponentScore = isTeamA ? match.score_b : match.score_a;
                            const canUpdate = canUpdateMatch(match.match_date, match.status);
                            const isEditing = editingMatch === match._id;

                            return (
                                <div key={match._id} className="match-card">
                                    <div className="match-header">
                                        <span className="match-number">
                                            Match #{match.match_number || 'N/A'}
                                        </span>
                                        <span 
                                            className="status-badge"
                                            style={{ backgroundColor: status.color }}
                                        >
                                            {status.icon} {status.label}
                                        </span>
                                    </div>

                                    <div className="match-info">
                                        <div className="info-row">
                                            <span>📅 {new Date(match.match_date).toLocaleDateString()}</span>
                                            <span>⏰ {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        {match.venue && (
                                            <div className="venue">📍 {match.venue}</div>
                                        )}
                                        {match.event_id?.title && (
                                            <div className="event">🏆 {match.event_id.title}</div>
                                        )}
                                    </div>

                                    <div className="teams-container">
                                        <div className="team-row">
                                            <div className="team-box your-team">
                                                <span className="team-label">Your Team</span>
                                                <span className="team-name">{yourTeam}</span>
                                            </div>
                                            
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={isTeamA ? scores.score_a : scores.score_b}
                                                    onChange={(e) => setScores({
                                                        ...scores,
                                                        [isTeamA ? 'score_a' : 'score_b']: e.target.value
                                                    })}
                                                    className="score-input"
                                                />
                                            ) : (
                                                <span className="score">{yourScore || 0}</span>
                                            )}
                                        </div>

                                        <div className="vs-text">VS</div>

                                        <div className="team-row">
                                            <div className="team-box">
                                                <span className="team-label">Opponent</span>
                                                <span className="team-name">{opponentTeam}</span>
                                            </div>
                                            
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={isTeamA ? scores.score_b : scores.score_a}
                                                    onChange={(e) => setScores({
                                                        ...scores,
                                                        [isTeamA ? 'score_b' : 'score_a']: e.target.value
                                                    })}
                                                    className="score-input"
                                                />
                                            ) : (
                                                <span className="score">{opponentScore || 0}</span>
                                            )}
                                        </div>
                                    </div>

                                    {match.status === 'completed' && match.winner && (
                                        <div className="result">
                                            {match.winner === 'draw' ? (
                                                <span className="draw-text">🤝 Match Drawn</span>
                                            ) : (
                                                <span className="winner-text">
                                                    🏆 Winner: {
                                                        (match.winner === 'team_a' && isTeamA) || 
                                                        (match.winner === 'team_b' && !isTeamA)
                                                            ? yourTeam
                                                            : opponentTeam
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="actions">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="btn-cancel"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => submitScore(match._id)}
                                                    className="btn-save"
                                                >
                                                    💾 Save Score
                                                </button>
                                            </>
                                        ) : (
                                            canUpdate && (
                                                <button
                                                    onClick={() => startEditing(match)}
                                                    className="btn-update"
                                                >
                                                    ✏️ Record Result
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                                            );
                        })}
                    </div>
                )}
            </div>
        </ManagerLayout>
    );
};

export default TeamMatches;
