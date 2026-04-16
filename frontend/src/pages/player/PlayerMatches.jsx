import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlayerMatches.css';
import { API_BASE_URL } from '../../utils/constants';

const PlayerMatches = () => {
    const [matches, setMatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('matches'); // 'matches' or 'stats'

    useEffect(() => {
        fetchMatchData();
    }, []);

    const fetchMatchData = async () => {
        try {
            setLoading(true);
            const [matchesRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/player/my-matches`, {
                    withCredentials: true
                }),
                axios.get(`${API_BASE_URL}/player/stats`, {
                    withCredentials: true
                })
            ]);

            if (matchesRes.data.success) {
                setMatches(matchesRes.data.matches || []);
                setStats(matchesRes.data.statistics);
            }

            if (statsRes.data.success) {
                // Merge additional stats
                setStats(prevStats => ({
                    ...prevStats,
                    ...statsRes.data.stats
                }));
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching match data:', err);
            setError(err.response?.data?.message || 'Failed to load match data');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getMatchResult = (match, teamId) => {
        const isTeamA = match.team_a._id === teamId;
        const yourScore = isTeamA ? match.score_a : match.score_b;
        const oppScore = isTeamA ? match.score_b : match.score_a;

        if (yourScore > oppScore) return { result: 'WON', class: 'won' };
        if (yourScore < oppScore) return { result: 'LOST', class: 'lost' };
        return { result: 'DRAW', class: 'draw' };
    };

    const renderStatistics = () => {
        if (!stats) return null;

        return (
            <div className="player-matches-page">
                <div className="player-matches-container">
                    <div className="page-header">
                        <h1>My Statistics</h1>
                        <button 
                            className="btn-secondary"
                            onClick={() => setViewMode('matches')}
                        >
                            ← Back to Matches
                        </button>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">🏆</div>
                            <div className="stat-value">{stats.total_matches || 0}</div>
                            <div className="stat-label">Total Matches</div>
                        </div>

                        <div className="stat-card won">
                            <div className="stat-icon">✓</div>
                            <div className="stat-value">{stats.won || 0}</div>
                            <div className="stat-label">Won</div>
                        </div>

                        <div className="stat-card draw">
                            <div className="stat-icon">−</div>
                            <div className="stat-value">{stats.drawn || 0}</div>
                            <div className="stat-label">Drawn</div>
                        </div>

                        <div className="stat-card lost">
                            <div className="stat-icon">✗</div>
                            <div className="stat-value">{stats.lost || 0}</div>
                            <div className="stat-label">Lost</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-value">{stats.winRate || '0'}%</div>
                            <div className="stat-label">Win Rate</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-value">{stats.teamsCount || 0}</div>
                            <div className="stat-label">Teams</div>
                        </div>
                    </div>

                    {stats.recentForm && stats.recentForm.length > 0 && (
                        <div className="recent-form-section">
                            <h3>Recent Form (Last 5 Matches)</h3>
                            <div className="form-badges">
                                {stats.recentForm.map((result, index) => (
                                    <span 
                                        key={index}
                                        className={`form-badge ${
                                            result === 'W' ? 'won' : 
                                            result === 'L' ? 'lost' : 'draw'
                                        }`}
                                    >
                                        {result}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderMatches = () => {
        return (
            <div className="player-matches-page">
                <div className="player-matches-container">
                    <div className="page-header">
                        <h1>My Match History</h1>
                        <button 
                            className="btn-primary"
                            onClick={() => setViewMode('stats')}
                        >
                            View Stats
                        </button>
                    </div>

                    {stats && (
                        <div className="quick-stats">
                            <div className="quick-stat">
                                <span className="label">Total:</span>
                                <span className="value">{stats.total_matches || 0}</span>
                            </div>
                            <div className="quick-stat won">
                                <span className="label">Won:</span>
                                <span className="value">{stats.won || 0}</span>
                            </div>
                            <div className="quick-stat draw">
                                <span className="label">Draw:</span>
                                <span className="value">{stats.drawn || 0}</span>
                            </div>
                            <div className="quick-stat lost">
                                <span className="label">Lost:</span>
                                <span className="value">{stats.lost || 0}</span>
                            </div>
                            <div className="quick-stat">
                                <span className="label">Win Rate:</span>
                                <span className="value">{stats.winRate || '0'}%</span>
                            </div>
                        </div>
                    )}

                    {matches.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>No Matches Yet</h3>
                            <p>Your match history will appear here once you've played some matches.</p>
                        </div>
                    ) : (
                        <div className="matches-list">
                            {matches.map((match) => {
                                const matchResult = getMatchResult(match, match.yourTeamId);
                                const isTeamA = match.team_a._id === match.yourTeamId;
                                const yourTeamName = isTeamA ? match.team_a.name : match.team_b.name;
                                const oppTeamName = isTeamA ? match.team_b.name : match.team_a.name;
                                const yourScore = isTeamA ? match.score_a : match.score_b;
                                const oppScore = isTeamA ? match.score_b : match.score_a;

                                return (
                                    <div key={match._id} className={`match-card ${matchResult.class}`}>
                                        <div className="match-header">
                                            <span className="match-date">
                                                {formatDate(match.match_date)}
                                            </span>
                                            <span className={`result-badge ${matchResult.class}`}>
                                                {matchResult.result}
                                            </span>
                                        </div>

                                        <div className="match-teams">
                                            <div className="team your-team">
                                                <span className="team-name">{yourTeamName}</span>
                                                <span className="team-score">{yourScore}</span>
                                            </div>
                                            <div className="vs-divider">VS</div>
                                            <div className="team opponent-team">
                                                <span className="team-score">{oppScore}</span>
                                                <span className="team-name">{oppTeamName}</span>
                                            </div>
                                        </div>

                                        {match.event_id && (
                                            <div className="match-event">
                                                <span className="event-icon">🏆</span>
                                                <span>{match.event_id.title}</span>
                                            </div>
                                        )}

                                        <div className="match-meta">
                                            <span className={`status-badge ${match.status}`}>
                                                {match.status}
                                            </span>
                                            {match.match_type && (
                                                <span className="match-type">{match.match_type}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="player-matches-page">
                <div className="player-matches-container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading your matches...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="player-matches-page">
                <div className="player-matches-container">
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Error Loading Matches</h3>
                        <p>{error}</p>
                        <button onClick={fetchMatchData} className="btn-primary">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return viewMode === 'stats' ? renderStatistics() : renderMatches();
};

export default PlayerMatches;
