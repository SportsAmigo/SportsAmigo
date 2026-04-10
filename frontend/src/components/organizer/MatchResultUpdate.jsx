 import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/MatchResultUpdate.css';

const MatchResultUpdate = ({ eventId }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [updatingMatch, setUpdatingMatch] = useState(null);
    const [scores, setScores] = useState({ score_a: 0, score_b: 0 });

    useEffect(() => {
        fetchMatches();
    }, [eventId]);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/matches/event/${eventId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setMatches(response.data.matches);
            }
        } catch (err) {
            console.error('Error fetching matches:', err);
            setError('Failed to load matches');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateResult = async (matchId) => {
        try {
            setError('');
            setSuccess('');

            const response = await axios.put(
                `http://localhost:5000/api/matches/${matchId}/result`,
                {
                    score_a: parseInt(scores.score_a),
                    score_b: parseInt(scores.score_b)
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuccess('Match result updated successfully!');
                setUpdatingMatch(null);
                setScores({ score_a: 0, score_b: 0 });
                fetchMatches(); // Refresh matches
            }
        } catch (err) {
            console.error('Error updating match result:', err);
            setError(err.response?.data?.message || 'Failed to update match result');
        }
    };

    const startUpdating = (match) => {
        setUpdatingMatch(match._id);
        setScores({
            score_a: match.score_a || 0,
            score_b: match.score_b || 0
        });
        setError('');
        setSuccess('');
    };

    const cancelUpdate = () => {
        setUpdatingMatch(null);
        setScores({ score_a: 0, score_b: 0 });
        setError('');
        setSuccess('');
    };

    const getStatusBadge = (status) => {
        const badges = {
            scheduled: <span className="badge badge-info">Scheduled</span>,
            in_progress: <span className="badge badge-warning">In Progress</span>,
            completed: <span className="badge badge-success">Completed</span>,
            cancelled: <span className="badge badge-danger">Cancelled</span>
        };
        return badges[status] || status;
    };

    const getWinnerDisplay = (match) => {
        if (match.status !== 'completed') return '-';
        
        if (match.winner === 'draw') {
            return <span className="winner-badge draw">Draw</span>;
        } else if (match.winner === 'team_a') {
            return <span className="winner-badge">{match.team_a_name}</span>;
        } else if (match.winner === 'team_b') {
            return <span className="winner-badge">{match.team_b_name}</span>;
        }
        return '-';
    };

    if (loading) {
        return <div className="match-results-loading">Loading matches...</div>;
    }

    return (
        <div className="match-results-container">
            <h2 className="match-results-title">Match Results</h2>

            {error && (
                <div className="alert alert-error">
                    <i className="fa fa-exclamation-circle"></i> {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <i className="fa fa-check-circle"></i> {success}
                </div>
            )}

            {matches.length === 0 ? (
                <div className="no-matches">
                    <p>No matches scheduled for this event yet.</p>
                </div>
            ) : (
                <div className="matches-list">
                    {matches.map((match) => (
                        <div key={match._id} className="match-card">
                            <div className="match-header">
                                <div className="match-info">
                                    <h3 className="match-teams">
                                        {match.team_a_name} vs {match.team_b_name}
                                    </h3>
                                    <p className="match-date">
                                        <i className="fa fa-calendar"></i>{' '}
                                        {new Date(match.match_date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    {match.venue && (
                                        <p className="match-venue">
                                            <i className="fa fa-map-marker"></i> {match.venue}
                                        </p>
                                    )}
                                </div>
                                <div className="match-status">
                                    {getStatusBadge(match.status)}
                                </div>
                            </div>

                            {match.status === 'completed' ? (
                                <div className="match-result">
                                    <div className="score-display">
                                        <div className="team-score">
                                            <span className="team-name">{match.team_a_name}</span>
                                            <span className="score">{match.score_a}</span>
                                        </div>
                                        <span className="score-separator">-</span>
                                        <div className="team-score">
                                            <span className="score">{match.score_b}</span>
                                            <span className="team-name">{match.team_b_name}</span>
                                        </div>
                                    </div>
                                    <div className="winner-display">
                                        Winner: {getWinnerDisplay(match)}
                                    </div>
                                </div>
                            ) : updatingMatch === match._id ? (
                                <div className="update-form">
                                    <h4>Update Match Result</h4>
                                    <div className="score-inputs">
                                        <div className="score-input-group">
                                            <label>{match.team_a_name}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={scores.score_a}
                                                onChange={(e) =>
                                                    setScores({ ...scores, score_a: e.target.value })
                                                }
                                                className="score-input"
                                            />
                                        </div>
                                        <span className="vs-separator">VS</span>
                                        <div className="score-input-group">
                                            <label>{match.team_b_name}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={scores.score_b}
                                                onChange={(e) =>
                                                    setScores({ ...scores, score_b: e.target.value })
                                                }
                                                className="score-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleUpdateResult(match._id)}
                                        >
                                            <i className="fa fa-save"></i> Save Result
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={cancelUpdate}
                                        >
                                            <i className="fa fa-times"></i> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="match-actions">
                                    <button
                                        className="btn btn-update"
                                        onClick={() => startUpdating(match)}
                                    >
                                        <i className="fa fa-edit"></i> Update Result
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatchResultUpdate;
