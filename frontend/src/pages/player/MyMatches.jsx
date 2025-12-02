import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyMatches.css';

const MyMatches = () => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/player/my-matches', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setMatches(data.matches);
                
                // Extract unique teams
                const uniqueTeams = [];
                const teamIds = new Set();
                data.matches.forEach(match => {
                    if (match.myTeam && !teamIds.has(match.myTeam._id)) {
                        teamIds.add(match.myTeam._id);
                        uniqueTeams.push(match.myTeam);
                    }
                });
                setTeams(uniqueTeams);
            } else {
                setError(data.message || 'Failed to fetch matches');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch matches');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getResultBadge = (result) => {
        const badges = {
            won: { class: 'result-won', text: 'Won', icon: 'fa-trophy' },
            lost: { class: 'result-lost', text: 'Lost', icon: 'fa-times-circle' },
            drawn: { class: 'result-drawn', text: 'Draw', icon: 'fa-handshake' }
        };
        const badge = badges[result] || badges.drawn;
        return (
            <span className={`result-badge ${badge.class}`}>
                <i className={`fas ${badge.icon}`}></i> {badge.text}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'status-pending', text: 'Pending' },
            verified: { class: 'status-verified', text: 'Verified' },
            disputed: { class: 'status-disputed', text: 'Disputed' },
            completed: { class: 'status-completed', text: 'Completed' }
        };
        const badge = badges[status] || badges.pending;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    const filteredMatches = selectedTeam === 'all' 
        ? matches 
        : matches.filter(m => m.myTeam?._id === selectedTeam);

    const stats = {
        total: filteredMatches.length,
        won: filteredMatches.filter(m => m.result === 'won').length,
        drawn: filteredMatches.filter(m => m.result === 'drawn').length,
        lost: filteredMatches.filter(m => m.result === 'lost').length
    };

    if (loading) {
        return (
            <div className="player-dashboard">
                <div className="container">
                    <div className="loading">Loading matches...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="player-dashboard">
            <div className="container">
                <div className="page-header">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                    <h1><i className="fas fa-history"></i> My Match History</h1>
                    <button className="btn-primary" onClick={() => navigate('/player/stats')}>
                        <i className="fas fa-chart-bar"></i> View Stats
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} className="alert-close">×</button>
                    </div>
                )}

                <div className="content-card">
                    {/* Quick Stats */}
                    <div className="quick-stats">
                        <div className="stat-item">
                            <div className="stat-label">Total Matches</div>
                            <div className="stat-value">{stats.total}</div>
                        </div>
                        <div className="stat-item stat-won">
                            <div className="stat-label">Won</div>
                            <div className="stat-value">{stats.won}</div>
                        </div>
                        <div className="stat-item stat-drawn">
                            <div className="stat-label">Drawn</div>
                            <div className="stat-value">{stats.drawn}</div>
                        </div>
                        <div className="stat-item stat-lost">
                            <div className="stat-label">Lost</div>
                            <div className="stat-value">{stats.lost}</div>
                        </div>
                    </div>

                    {/* Team Filter */}
                    {teams.length > 1 && (
                        <div className="filter-section">
                            <label htmlFor="team-filter">Filter by Team:</label>
                            <select 
                                id="team-filter"
                                value={selectedTeam} 
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="team-select"
                            >
                                <option value="all">All Teams ({matches.length})</option>
                                {teams.map(team => (
                                    <option key={team._id} value={team._id}>
                                        {team.name} ({matches.filter(m => m.myTeam?._id === team._id).length})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Matches List */}
                    <div className="matches-list">
                        {filteredMatches.length === 0 ? (
                            <div className="no-matches">
                                <i className="fas fa-futbol"></i>
                                <p>No matches found</p>
                            </div>
                        ) : (
                            filteredMatches.map(match => (
                                <div key={match._id} className={`match-card result-${match.result}`}>
                                    <div className="match-header">
                                        <div className="match-date">{formatDate(match.date)}</div>
                                        <div className="match-badges">
                                            {getResultBadge(match.result)}
                                            {getStatusBadge(match.status)}
                                        </div>
                                    </div>

                                    <div className="match-body">
                                        <div className="match-teams">
                                            <div className={`team-info ${match.myTeam?._id === match.team_a?._id ? 'my-team' : ''}`}>
                                                <h4>{match.team_a?.name || 'Team A'}</h4>
                                                {match.myTeam?._id === match.team_a?._id && (
                                                    <span className="my-team-badge">My Team</span>
                                                )}
                                                <div className="team-score">{match.team_a_score}</div>
                                            </div>

                                            <div className="match-vs">VS</div>

                                            <div className={`team-info ${match.myTeam?._id === match.team_b?._id ? 'my-team' : ''}`}>
                                                <h4>{match.team_b?.name || 'Team B'}</h4>
                                                {match.myTeam?._id === match.team_b?._id && (
                                                    <span className="my-team-badge">My Team</span>
                                                )}
                                                <div className="team-score">{match.team_b_score}</div>
                                            </div>
                                        </div>

                                        {match.location && (
                                            <div className="match-location">
                                                <i className="fas fa-map-marker-alt"></i> {match.location}
                                            </div>
                                        )}

                                        {match.event_id && (
                                            <div className="match-event">
                                                <i className="fas fa-calendar"></i> {match.event_id.title || 'Tournament Match'}
                                            </div>
                                        )}

                                        {match.match_type === 'friendly' && (
                                            <div className="match-type">
                                                <i className="fas fa-handshake"></i> Friendly Match
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyMatches;
