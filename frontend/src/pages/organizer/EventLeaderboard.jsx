import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EventLeaderboard.css';

const EventLeaderboard = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLeaderboard();
    }, [eventId]);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/organizer/event/${eventId}/leaderboard`,
                { credentials: 'include' }
            );
            const data = await response.json();
            if (data.success) {
                setLeaderboard(data.leaderboard);
            } else {
                setError(data.message || 'Failed to fetch leaderboard');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (position) => {
        if (position === 1) return '🥇';
        if (position === 2) return '🥈';
        if (position === 3) return '🥉';
        return position;
    };

    const exportToCSV = () => {
        const headers = ['Rank', 'Team', 'Played', 'Won', 'Drawn', 'Lost', 'GF', 'GA', 'GD', 'Points'];
        const rows = leaderboard.map((team, index) => [
            index + 1,
            team.name,
            team.played,
            team.won,
            team.drawn,
            team.lost,
            team.goals_for,
            team.goals_against,
            team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference,
            team.points
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="organizer-dashboard">
                <div className="container">
                    <div className="loading">Loading leaderboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="organizer-dashboard">
            <div className="container">
                <div className="page-header">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                    <h1><i className="fas fa-trophy"></i> Tournament Leaderboard</h1>
                    <button className="btn-primary" onClick={exportToCSV}>
                        <i className="fas fa-download"></i> Export CSV
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} className="alert-close">×</button>
                    </div>
                )}

                <div className="content-card">
                    {leaderboard.length === 0 ? (
                        <div className="no-data">
                            <i className="fas fa-clipboard-list"></i>
                            <p>No matches have been verified yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="leaderboard-stats">
                                <div className="stat-card">
                                    <div className="stat-label">Total Teams</div>
                                    <div className="stat-value">{leaderboard.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Total Matches</div>
                                    <div className="stat-value">
                                        {leaderboard.reduce((sum, team) => sum + team.played, 0) / 2}
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Total Goals</div>
                                    <div className="stat-value">
                                        {leaderboard.reduce((sum, team) => sum + team.goals_for, 0)}
                                    </div>
                                </div>
                            </div>

                            <div className="table-container">
                                <table className="leaderboard-table">
                                    <thead>
                                        <tr>
                                            <th className="col-rank">Rank</th>
                                            <th className="col-team">Team</th>
                                            <th className="col-stat">P</th>
                                            <th className="col-stat">W</th>
                                            <th className="col-stat">D</th>
                                            <th className="col-stat">L</th>
                                            <th className="col-stat">GF</th>
                                            <th className="col-stat">GA</th>
                                            <th className="col-stat">GD</th>
                                            <th className="col-points">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((team, index) => (
                                            <tr key={team._id} className={index < 3 ? `top-${index + 1}` : ''}>
                                                <td className="col-rank">
                                                    <span className="rank-badge">{getRankBadge(index + 1)}</span>
                                                </td>
                                                <td className="col-team">
                                                    <div className="team-name">{team.name}</div>
                                                </td>
                                                <td className="col-stat">{team.played}</td>
                                                <td className="col-stat text-success">{team.won}</td>
                                                <td className="col-stat text-warning">{team.drawn}</td>
                                                <td className="col-stat text-danger">{team.lost}</td>
                                                <td className="col-stat">{team.goals_for}</td>
                                                <td className="col-stat">{team.goals_against}</td>
                                                <td className={`col-stat ${team.goal_difference > 0 ? 'text-success' : team.goal_difference < 0 ? 'text-danger' : ''}`}>
                                                    {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                                                </td>
                                                <td className="col-points">
                                                    <span className="points-badge">{team.points}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="table-legend">
                                <div className="legend-item">
                                    <strong>P:</strong> Played
                                </div>
                                <div className="legend-item">
                                    <strong>W:</strong> Won
                                </div>
                                <div className="legend-item">
                                    <strong>D:</strong> Drawn
                                </div>
                                <div className="legend-item">
                                    <strong>L:</strong> Lost
                                </div>
                                <div className="legend-item">
                                    <strong>GF:</strong> Goals For
                                </div>
                                <div className="legend-item">
                                    <strong>GA:</strong> Goals Against
                                </div>
                                <div className="legend-item">
                                    <strong>GD:</strong> Goal Difference
                                </div>
                                <div className="legend-item">
                                    <strong>Pts:</strong> Points (Win=3, Draw=1)
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventLeaderboard;
