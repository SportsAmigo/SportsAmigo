import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './BrowseTeams.css';

const BrowseTeams = () => {
    const user = useSelector(selectUser);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sportFilter, setSportFilter] = useState('');
    const [requestStatus, setRequestStatus] = useState({});

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/player/browse-teams', { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                setTeams(response.data.teams || []);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        // Filter teams locally based on search term and sport filter
        fetchTeams();
    };

    const filteredTeams = teams.filter(team => {
        const matchesSearch = !searchTerm || 
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesSport = !sportFilter || team.sport_type === sportFilter;
        
        return matchesSearch && matchesSport;
    });

    const handleJoinRequest = async (teamId, teamName) => {
        try {
            const response = await axios.post(
                `http://localhost:5000/api/player/teams/${teamId}/join`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                alert(response.data.message || `Request to join ${teamName} sent successfully!`);
                setRequestStatus({ ...requestStatus, [teamId]: 'pending' });
                fetchTeams(); // Refresh the list
            } else {
                alert(response.data.message || 'Failed to send join request');
            }
        } catch (error) {
            console.error('Error sending join request:', error);
            alert(error.response?.data?.message || 'Error sending join request');
        }
    };

    const getButtonForTeam = (team) => {
        if (team.already_joined) {
            return (
                <span className="team-status-badge joined">
                    <i className="fa fa-check"></i> Joined
                </span>
            );
        }

        if (requestStatus[team.id] === 'pending' || team.request_status === 'pending') {
            return (
                <span className="team-status-badge pending">
                    <i className="fa fa-clock"></i> Request Pending
                </span>
            );
        }

        const isFull = team.current_members >= team.max_members;
        
        return (
            <button
                onClick={() => handleJoinRequest(team.id, team.name)}
                className="team-join-btn"
                disabled={isFull}
            >
                <i className="fa fa-user-plus"></i>
                {isFull ? 'Team Full' : 'Request to Join'}
            </button>
        );
    };

    return (
        <PlayerLayout>
            <div className="browse-wrapper">
                {/* Header */}
                <div className="teams-page-header">
                    <div className="header-content-wrapper">
                        <div className="header-text">
                            <h1>
                                <i className="fa fa-search"></i> Browse Teams
                            </h1>
                            <p>Find a team to join and compete together</p>
                        </div>
                        <Link to="/player/my-teams" className="header-action-btn">
                            <i className="fa fa-users"></i> My Teams
                        </Link>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="search-filters-section">
                    <div className="filters-grid">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search teams by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <select
                            className="filter-select"
                            value={sportFilter}
                            onChange={(e) => setSportFilter(e.target.value)}
                        >
                            <option value="">All Sports</option>
                            <option value="Football">Football</option>
                            <option value="Basketball">Basketball</option>
                            <option value="Cricket">Cricket</option>
                            <option value="Tennis">Tennis</option>
                            <option value="Badminton">Badminton</option>
                            <option value="Volleyball">Volleyball</option>
                        </select>
                        <button 
                            className="search-button"
                            onClick={handleSearch}
                        >
                            <i className="fa fa-search"></i> Search
                        </button>
                    </div>
                </div>

                {/* Teams Grid */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading teams...</p>
                    </div>
                ) : filteredTeams && filteredTeams.length > 0 ? (
                    <div className="teams-grid">
                        {filteredTeams.map((team) => (
                            <div key={team.id} className="team-card">
                                <div className="team-header">
                                    <h3 className="team-title">{team.name}</h3>
                                    <span className="team-sport-badge">{team.sport_type}</span>
                                    </div>

                                {team.description && (
                                    <p className="team-description">
                                        {team.description.length > 100
                                            ? `${team.description.substring(0, 100)}...`
                                            : team.description}
                                    </p>
                                )}

                                <div className="team-info-list">
                                    <div className="team-info-item">
                                        <i className="fa fa-user"></i>
                                        <span><strong>Manager:</strong> {team.manager_name || team.manager_email}</span>
                                    </div>
                                    <div className="team-info-item">
                                        <i className="fa fa-users"></i>
                                        <span><strong>Members:</strong> {team.current_members} / {team.max_members}</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="team-progress-bar">
                                    <div
                                        className={`team-progress-fill ${
                                            team.current_members >= team.max_members ? 'full' : ''
                                        }`}
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                (team.current_members / team.max_members) * 100
                                            )}%`,
                                        }}
                                    ></div>
                                </div>

                                <div className="team-footer">
                                    <Link
                                        to={`/player/team/${team.id}`}
                                        className="team-details-btn"
                                    >
                                        <i className="fa fa-info-circle"></i> Details
                                    </Link>
                                    {getButtonForTeam(team)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <i className="fa fa-info-circle"></i>
                        <h3>No Teams Found</h3>
                        <p>
                            {searchTerm || sportFilter
                                ? `No teams found matching your search criteria. Showing 0 of ${teams.length} teams.`
                                : 'No teams available at the moment. Check back later!'}
                        </p>
                        {(searchTerm || sportFilter) && teams.length > 0 && (
                            <button 
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSportFilter('');
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </PlayerLayout>
    );
};

export default BrowseTeams;
