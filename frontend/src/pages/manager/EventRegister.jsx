import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ManagerLayout from '../../components/layout/ManagerLayout';
import './EventRegister.css';

const EventRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching event details for ID:', id);
      const [eventRes, teamsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/manager/event/${id}/details`, { withCredentials: true }),
        axios.get('http://localhost:5000/api/manager/my-teams', { withCredentials: true })
      ]);
      
      console.log('Event response:', eventRes.data);
      console.log('Teams response:', teamsRes.data);

      if (eventRes.data.success && teamsRes.data.success) {
        setEvent(eventRes.data.event);
        setTeams(teamsRes.data.teams || []);
        console.log('Event loaded:', eventRes.data.event);
        console.log('Teams loaded:', teamsRes.data.teams);
        
        // Check if already registered
        if (eventRes.data.event.isRegistered) {
          setError('You are already registered for this event');
        }
      } else {
        console.error('Failed response:', { eventRes: eventRes.data, teamsRes: teamsRes.data });
        setError('Failed to load event or teams data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTeam) {
      alert('Please select a team');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Registering team:', selectedTeam, 'for event:', id);
      const response = await axios.post(
        `http://localhost:5000/api/manager/event/${id}/register`,
        {
          team_id: selectedTeam,
          notes: notes.trim()
        },
        { withCredentials: true }
      );
      
      console.log('Registration response:', response.data);

      if (response.data.success) {
        alert('Registration submitted successfully! Waiting for organizer approval.');
        navigate('/manager/browse-events');
      } else {
        alert(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Error submitting registration:', err);
      alert(err.response?.data?.message || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ManagerLayout>
        <div className="event-register-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading event details...</p>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  if (error || !event) {
    return (
      <ManagerLayout>
        <div className="event-register-container">
          <div className="error-container">
            <i className="fas fa-exclamation-circle"></i>
            <h3>Unable to Load Event</h3>
            <p>{error || 'Event not found'}</p>
            <Link to="/manager/browse-events" className="btn-back">
              <i className="fas fa-arrow-left"></i>
              Back to Events
            </Link>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  // Filter out teams with no members
  const eligibleTeams = teams.filter(team => team.members && team.members.length > 0);

  if (teams.length === 0) {
    return (
      <ManagerLayout>
        <div className="event-register-container">
          <div className="register-wrapper">
            <div className="page-header">
              <Link to="/manager/browse-events" className="back-link">
                <i className="fas fa-arrow-left"></i>
                Back
              </Link>
              <h1 className="page-title">Register for Event</h1>
            </div>
            
            <div className="no-teams-warning">
              <i className="fas fa-users-slash"></i>
              <h3>No Teams Available</h3>
              <p>You need to create a team before registering for events.</p>
              <Link to="/manager/create-team" className="btn-create-team">
                <i className="fas fa-plus-circle"></i>
                Create Your First Team
              </Link>
            </div>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  if (eligibleTeams.length === 0) {
    return (
      <ManagerLayout>
        <div className="event-register-container">
          <div className="register-wrapper">
            <div className="page-header">
              <Link to="/manager/browse-events" className="back-link">
                <i className="fas fa-arrow-left"></i>
                Back
              </Link>
              <h1 className="page-title">Register for Event</h1>
            </div>
            
            <div className="no-teams-warning">
              <i className="fas fa-users-slash"></i>
              <h3>No Eligible Teams</h3>
              <p>All your teams need to have at least one player before you can register for events.</p>
              <Link to="/manager/my-teams" className="btn-create-team">
                <i className="fas fa-users"></i>
                Add Players to Your Teams
              </Link>
            </div>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout>
      <div className="event-register-container">
        <div className="register-wrapper">
          <div className="page-header">
            <Link to="/manager/browse-events" className="back-link">
              <i className="fas fa-arrow-left"></i>
              Back
            </Link>
            <h1 className="page-title">Register for Event</h1>
          </div>

          <div className="register-card">
            {/* Event Info Section */}
            <div className="event-info-section">
              <div className="event-header">
                <span className="sport-badge">
                  <i className="fas fa-basketball-ball"></i>
                  {event.sport || event.sport_type}
                </span>
                <h2>{event.name}</h2>
              </div>
              <div className="event-quick-info">
                <div className="quick-info-item">
                  <i className="fas fa-calendar"></i>
                  <span>{new Date(event.date || event.event_date).toLocaleDateString()}</span>
                </div>
                <div className="quick-info-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{event.location || event.venue}</span>
                </div>
                <div className="quick-info-item">
                  <i className="fas fa-users"></i>
                  <span>{event.registered_teams?.length || 0}/{event.max_participants || event.max_teams} Teams</span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-section">
                <h3>Select Your Team</h3>
                <p className="section-description">Choose which team you want to register for this event</p>
                
                <div className="team-selection">
                  {eligibleTeams.map(team => (
                    <div
                      key={team._id}
                      className={`team-option ${selectedTeam === team._id ? 'selected' : ''}`}
                      onClick={() => setSelectedTeam(team._id)}
                    >
                      <input
                        type="radio"
                        name="team"
                        value={team._id}
                        checked={selectedTeam === team._id}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                      />
                      <div className="team-option-content">
                        <h4>{team.name}</h4>
                        <div className="team-option-meta">
                          <span>
                            <i className="fas fa-basketball-ball"></i>
                            {team.sport}
                          </span>
                          <span>
                            <i className="fas fa-users"></i>
                            {team.members?.length || 0} Members
                          </span>
                        </div>
                      </div>
                      <div className="check-icon">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Notes <span className="optional-label">(Optional)</span></h3>
                <p className="section-description">Add any additional information for the organizer</p>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Special requirements, questions, or comments..."
                  rows="4"
                  className="notes-textarea"
                  maxLength="500"
                />
                <div className="char-count">
                  {notes.length}/500 characters
                </div>
              </div>

              <div className="form-actions">
                <Link to="/manager/browse-events" className="btn-cancel">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={!selectedTeam || submitting}
                >
                  {submitting ? (
                    <>
                      <div className="btn-spinner"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Submit Registration
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Important Notice */}
            <div className="notice-section">
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Important:</strong> Your registration will be sent to the event organizer for approval. 
                You will be notified once they review your request.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default EventRegister;
