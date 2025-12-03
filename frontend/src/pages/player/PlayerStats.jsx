import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerStats.css';

const PlayerStats = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:5000/player/stats', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            } else {
                setError(data.message || 'Failed to fetch statistics');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch statistics');
        } finally {
            setLoading(false);
        }
    };

    const calculateWinRate = () => {
        if (!stats || stats.total_matches === 0) return 0;
        return ((stats.total_won / stats.total_matches) * 100).toFixed(1);
    };

    const getFormDisplay = () => {
        if (!stats || !stats.recent_form || stats.recent_form.length === 0) {
            return <span className="no-form">No recent matches</span>;
        }

        return stats.recent_form.map((result, index) => {
            const badges = {
                W: { class: 'form-won', icon: 'W' },
                D: { class: 'form-drawn', icon: 'D' },
                L: { class: 'form-lost', icon: 'L' }
            };
            const badge = badges[result] || badges.D;
            return (
                <span key={index} className={`form-badge ${badge.class}`}>
                    {badge.icon}
                </span>
            );
        });
    };

    if (loading) {
        return (
            <div className="player-dashboard">
                <div className="container">
                    <div className="loading">Loading statistics...</div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="player-dashboard">
                <div className="container">
                    <div className="alert alert-error">
                        {error || 'Failed to load statistics'}
                    </div>
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
                    <h1><i className="fas fa-chart-line"></i> My Statistics</h1>
                    <button className="btn-primary" onClick={() => navigate('/player/my-matches')}>
                        <i className="fas fa-history"></i> Match History
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} className="alert-close">×</button>
                    </div>
                )}

                {/* Overall Statistics */}
                <div className="stats-grid">
                    <div className="stat-card stat-primary">
                        <div className="stat-icon">
                            <i className="fas fa-futbol"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total Matches</div>
                            <div className="stat-value">{stats.total_matches}</div>
                        </div>
                    </div>

                    <div className="stat-card stat-success">
                        <div className="stat-icon">
                            <i className="fas fa-trophy"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Matches Won</div>
                            <div className="stat-value">{stats.total_won}</div>
                        </div>
                    </div>

                    <div className="stat-card stat-warning">
                        <div className="stat-icon">
                            <i className="fas fa-handshake"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Matches Drawn</div>
                            <div className="stat-value">{stats.total_drawn}</div>
                        </div>
                    </div>

                    <div className="stat-card stat-danger">
                        <div className="stat-icon">
                            <i className="fas fa-times-circle"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Matches Lost</div>
                            <div className="stat-value">{stats.total_lost}</div>
                        </div>
                    </div>
                </div>

                {/* Win Rate and Recent Form */}
                <div className="content-row">
                    <div className="content-card">
                        <h3><i className="fas fa-percentage"></i> Win Rate</h3>
                        <div className="win-rate-display">
                            <div className="win-rate-circle">
                                <svg viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="#E5E7EB"
                                        strokeWidth="8"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="8"
                                        strokeDasharray={`${calculateWinRate() * 2.51} 251`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="win-rate-text">
                                    <span className="win-rate-value">{calculateWinRate()}%</span>
                                </div>
                            </div>
                            <div className="win-rate-details">
                                <div className="detail-row">
                                    <span>Total Matches:</span>
                                    <strong>{stats.total_matches}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Wins:</span>
                                    <strong className="text-success">{stats.total_won}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Win Rate:</span>
                                    <strong>{calculateWinRate()}%</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="content-card">
                        <h3><i className="fas fa-chart-bar"></i> Recent Form</h3>
                        <p className="form-subtitle">Last {stats.recent_form?.length || 0} matches</p>
                        <div className="recent-form">
                            {getFormDisplay()}
                        </div>
                        <div className="form-legend">
                            <div className="legend-item">
                                <span className="form-badge form-won">W</span> Win
                            </div>
                            <div className="legend-item">
                                <span className="form-badge form-drawn">D</span> Draw
                            </div>
                            <div className="legend-item">
                                <span className="form-badge form-lost">L</span> Loss
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Statistics */}
                {stats.team_stats && stats.team_stats.length > 0 && (
                    <div className="content-card">
                        <h3><i className="fas fa-users"></i> Performance by Team</h3>
                        <div className="team-stats-list">
                            {stats.team_stats.map(team => {
                                const teamWinRate = team.matches_played > 0 
                                    ? ((team.matches_won / team.matches_played) * 100).toFixed(1) 
                                    : 0;

                                return (
                                    <div key={team.team_id} className="team-stat-card">
                                        <div className="team-stat-header">
                                            <h4>{team.team_name}</h4>
                                            <span className="team-win-rate">{teamWinRate}% win rate</span>
                                        </div>
                                        <div className="team-stat-grid">
                                            <div className="team-stat-item">
                                                <div className="team-stat-label">Played</div>
                                                <div className="team-stat-value">{team.matches_played}</div>
                                            </div>
                                            <div className="team-stat-item">
                                                <div className="team-stat-label">Won</div>
                                                <div className="team-stat-value text-success">{team.matches_won}</div>
                                            </div>
                                            <div className="team-stat-item">
                                                <div className="team-stat-label">Drawn</div>
                                                <div className="team-stat-value text-warning">{team.matches_drawn}</div>
                                            </div>
                                            <div className="team-stat-item">
                                                <div className="team-stat-label">Lost</div>
                                                <div className="team-stat-value text-danger">{team.matches_lost}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* No Data State */}
                {stats.total_matches === 0 && (
                    <div className="content-card">
                        <div className="no-data">
                            <i className="fas fa-chart-bar"></i>
                            <h3>No Statistics Available</h3>
                            <p>Start playing matches to see your statistics here!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerStats;
