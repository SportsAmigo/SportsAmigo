import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EventMatches.css';

const EventMatches = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [matches, setMatches] = useState({ pending: [], verified: [], disputed: [] });
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [disputeModal, setDisputeModal] = useState({ show: false, matchId: null, reason: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchMatches();
    }, [eventId]);

    const fetchMatches = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/matches/event/${eventId}`,
                { credentials: 'include' }
            );
            const data = await response.json();
            if (data.success) {
                setMatches(data.matches);
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

    const handleVerify = async (matchId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/matches/${matchId}/approve`,
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );
            const data = await response.json();
            
            if (data.success) {
                setSuccess('Match verified successfully!');
                setTimeout(() => setSuccess(''), 3000);
                fetchMatches();
            } else {
                setError(data.message || 'Failed to verify match');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to verify match');
        }
    };

    const handleDispute = async () => {
        if (!disputeModal.reason.trim()) {
            setError('Please provide a reason for dispute');
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/matches/${disputeModal.matchId}/reject`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ reason: disputeModal.reason })
                }
            );
            const data = await response.json();
            
            if (data.success) {
                setSuccess('Match disputed successfully!');
                setTimeout(() => setSuccess(''), 3000);
                setDisputeModal({ show: false, matchId: null, reason: '' });
                fetchMatches();
            } else {
                setError(data.message || 'Failed to dispute match');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to dispute match');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'status-pending', text: 'Pending' },
            verified: { class: 'status-verified', text: 'Verified' },
            disputed: { class: 'status-disputed', text: 'Disputed' },
            completed: { class: 'status-completed', text: 'Completed' },
            cancelled: { class: 'status-cancelled', text: 'Cancelled' }
        };
        const badge = badges[status] || badges.pending;
        return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
    };

    const renderMatchCard = (match) => (
        <div key={match._id} className="match-card">
            <div className="match-header">
                {formatDate(match.date) && <div className="match-date">{formatDate(match.date)}</div>}
                {getStatusBadge(match.status)}
            </div>
            
            <div className="match-body">
                <div className="match-teams">
                    <div className="team-info">
                        <h4>{match.team_a?.name || match.team_a_name || 'Team A'}</h4>
                        <div className="team-score">{match.score_a !== undefined ? match.score_a : (match.team_a_score || 0)}</div>
                    </div>
                    <div className="match-vs">VS</div>
                    <div className="team-info">
                        <h4>{match.team_b?.name || match.team_b_name || 'Team B'}</h4>
                        <div className="team-score">{match.score_b !== undefined ? match.score_b : (match.team_b_score || 0)}</div>
                    </div>
                </div>

                {match.status === 'pending' && (
                    <div className="score-info-box">
                        <div className="score-label">
                            <i className="fas fa-info-circle"></i> Submitted Score
                        </div>
                        <div className="score-details">
                            This score was submitted by the team manager and is awaiting your approval.
                            {match.recorded_by && (
                                <div className="submission-info">
                                    <strong>Submitted by:</strong> {match.recorded_by.name || match.recorded_by.email}
                                </div>
                            )}
                            {match.updated_at && (
                                <div className="submission-info">
                                    <strong>Submitted on:</strong> {formatDate(match.updated_at)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {match.location && (
                    <div className="match-location">
                        <i className="fas fa-map-marker-alt"></i> {match.location}
                    </div>
                )}

                {match.dispute_reason && (
                    <div className="dispute-reason">
                        <strong>Dispute Reason:</strong> {match.dispute_reason}
                    </div>
                )}

                {match.notes && (
                    <div className="match-notes">
                        <strong>Notes:</strong> {match.notes}
                    </div>
                )}
            </div>

            {match.status === 'pending' && (
                <div className="match-actions">
                    <button 
                        className="btn-verify" 
                        onClick={() => handleVerify(match._id)}
                    >
                        <i className="fas fa-check"></i> Verify
                    </button>
                    <button 
                        className="btn-dispute" 
                        onClick={() => setDisputeModal({ show: true, matchId: match._id, reason: '' })}
                    >
                        <i className="fas fa-times"></i> Dispute
                    </button>
                </div>
            )}

            {match.status === 'verified' && (
                <div className="verification-info">
                    {match.verified_by ? (
                        <>
                            Verified by: {match.verified_by.name || match.verified_by.email} 
                            {match.verified_at && ` on ${formatDate(match.verified_at)}`}
                        </>
                    ) : match.verified_at ? (
                        `Verified on ${formatDate(match.verified_at)}`
                    ) : (
                        'Verified'
                    )}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="organizer-dashboard">
                <div className="container">
                    <div className="loading">Loading matches...</div>
                </div>
            </div>
        );
    }

    const currentMatches = matches[activeTab] || [];

    return (
        <div className="organizer-dashboard">
            <div className="container">
                <div className="page-header">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i> Back
                    </button>
                    <h1>Event Matches</h1>
                    <div className="header-actions">
                        <button 
                            className="btn-schedule" 
                            onClick={() => navigate(`/organizer/event/${eventId}/schedule-matches`)}
                        >
                            <i className="fas fa-calendar-plus"></i> Schedule Matches
                        </button>
                        <button 
                            className="btn-primary" 
                            onClick={() => navigate(`/organizer/event/${eventId}/leaderboard`)}
                        >
                            <i className="fas fa-trophy"></i> View Leaderboard
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError('')} className="alert-close">×</button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        {success}
                        <button onClick={() => setSuccess('')} className="alert-close">×</button>
                    </div>
                )}

                <div className="content-card">
                    <div className="tabs">
                        <button 
                            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Pending ({matches.pending?.length || 0})
                        </button>
                        <button 
                            className={`tab ${activeTab === 'verified' ? 'active' : ''}`}
                            onClick={() => setActiveTab('verified')}
                        >
                            Verified ({matches.verified?.length || 0})
                        </button>
                        <button 
                            className={`tab ${activeTab === 'disputed' ? 'active' : ''}`}
                            onClick={() => setActiveTab('disputed')}
                        >
                            Disputed ({matches.disputed?.length || 0})
                        </button>
                    </div>

                    <div className="matches-list">
                        {currentMatches.length === 0 ? (
                            <div className="no-matches">
                                <i className="fas fa-inbox"></i>
                                <p>No {activeTab} matches found</p>
                            </div>
                        ) : (
                            currentMatches.map(match => renderMatchCard(match))
                        )}
                    </div>
                </div>
            </div>

            {/* Dispute Modal */}
            {disputeModal.show && (
                <div className="modal-overlay" onClick={() => setDisputeModal({ show: false, matchId: null, reason: '' })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Dispute Match</h3>
                            <button 
                                className="modal-close" 
                                onClick={() => setDisputeModal({ show: false, matchId: null, reason: '' })}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <label>
                                Reason for dispute:
                                <textarea
                                    value={disputeModal.reason}
                                    onChange={(e) => setDisputeModal({ ...disputeModal, reason: e.target.value })}
                                    placeholder="Explain why this match is being disputed..."
                                    rows="4"
                                />
                            </label>
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-secondary" 
                                onClick={() => setDisputeModal({ show: false, matchId: null, reason: '' })}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-dispute" 
                                onClick={handleDispute}
                            >
                                Submit Dispute
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventMatches;
