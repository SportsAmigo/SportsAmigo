import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';

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
            const response = await axios.get('http://localhost:5000/api/player/api/teams/browse', { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                setTeams(response.data.teams);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (sportFilter) params.append('sport', sportFilter);

            const response = await axios.get(
                `http://localhost:5000/api/player/api/teams/search?${params.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setTeams(response.data.teams);
            }
        } catch (error) {
            console.error('Error searching teams:', error);
        } finally {
            setLoading(false);
        }
    };

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
                <span className="badge bg-success">
                    <i className="fa fa-check me-1"></i> Joined
                </span>
            );
        }

        if (requestStatus[team.id] === 'pending' || team.request_status === 'pending') {
            return (
                <span className="badge bg-warning">
                    <i className="fa fa-clock me-1"></i> Request Pending
                </span>
            );
        }

        const isFull = team.current_members >= team.max_members;
        
        return (
            <button
                onClick={() => handleJoinRequest(team.id, team.name)}
                className={`btn btn-sm ${isFull ? 'btn-secondary' : 'btn-primary'}`}
                disabled={isFull}
            >
                <i className="fa fa-user-plus me-1"></i>
                {isFull ? 'Team Full' : 'Request to Join'}
            </button>
        );
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 className="mb-0">
                                        <i className="fa fa-search me-2"></i> Browse Teams
                                    </h2>
                                    <p className="lead mt-2 mb-0">Find a team to join and compete together</p>
                                </div>
                                <Link to="/player/my-teams" className="btn btn-light btn-lg">
                                    <i className="fa fa-users me-2"></i> My Teams
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-5">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search teams by name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <select
                                        className="form-select"
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
                                </div>
                                <div className="col-md-3">
                                    <button 
                                        className="btn btn-primary w-100"
                                        onClick={handleSearch}
                                    >
                                        <i className="fa fa-search me-2"></i> Search
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams Grid */}
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {loading ? (
                    <div className="col-12 text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading teams...</p>
                    </div>
                ) : teams && teams.length > 0 ? (
                    teams.map((team) => (
                        <div key={team.id} className="col">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title mb-0">{team.name}</h5>
                                        <span className="badge bg-primary">{team.sport_type}</span>
                                    </div>

                                    {team.description && (
                                        <p className="card-text text-muted small mb-3">
                                            {team.description.length > 100
                                                ? `${team.description.substring(0, 100)}...`
                                                : team.description}
                                        </p>
                                    )}

                                    <div className="mb-3">
                                        <p className="mb-2 small">
                                            <i className="fa fa-user me-2 text-muted"></i>
                                            <strong>Manager:</strong> {team.manager_name || team.manager_email}
                                        </p>
                                        <p className="mb-0 small">
                                            <i className="fa fa-users me-2 text-muted"></i>
                                            <strong>Members:</strong> {team.current_members} / {team.max_members}
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="progress mb-3" style={{ height: '8px' }}>
                                        <div
                                            className={`progress-bar ${
                                                team.current_members >= team.max_members
                                                    ? 'bg-danger'
                                                    : 'bg-success'
                                            }`}
                                            role="progressbar"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    (team.current_members / team.max_members) * 100
                                                )}%`,
                                            }}
                                        ></div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <Link
                                            to={`/player/team/${team.id}`}
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            <i className="fa fa-info-circle me-1"></i> Details
                                        </Link>
                                        {getButtonForTeam(team)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="alert alert-info text-center">
                            <i className="fa fa-info-circle me-2"></i>
                            {searchTerm || sportFilter
                                ? 'No teams found matching your search criteria.'
                                : 'No teams available at the moment. Check back later!'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseTeams;
