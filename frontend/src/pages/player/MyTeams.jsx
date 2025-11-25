import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';

const MyTeams = () => {
    const user = useSelector(selectUser);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyTeams();
    }, []);

    const fetchMyTeams = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/player/my-teams', { withCredentials: true });
            if (response.data.success) {
                setTeams(response.data.teams);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;
        
        try {
            const response = await axios.post(`http://localhost:5000/api/player/teams/leave/${teamId}`, {}, { withCredentials: true });
            if (response.data.success) {
                alert('Left team successfully');
                fetchMyTeams();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error leaving team');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 className="mb-0"><i className="fa fa-users me-2"></i> My Teams</h2>
                                    <p className="lead mt-2 mb-0">Teams you're currently a member of</p>
                                </div>
                                <Link to="/player/browse-teams" className="btn btn-light btn-lg">
                                    <i className="fa fa-search me-2"></i> Browse Teams
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {teams && teams.length > 0 ? (
                teams.map(team => (
                    <div key={team.id} className="row mb-5">
                        <div className="col-12">
                            <div className="card shadow-sm">
                                <div className="card-header bg-light">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h4 className="mb-0">
                                            {team.name} <span className="badge bg-primary ms-2">{team.sport}</span>
                                        </h4>
                                        <button 
                                            onClick={() => handleLeaveTeam(team.id)} 
                                            className="btn btn-outline-danger btn-sm"
                                        >
                                            <i className="fa fa-sign-out me-1"></i> Leave Team
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <p><strong>Manager:</strong> {team.manager_name || team.manager_email}</p>
                                            <p><strong>Members:</strong> {team.current_members} of {team.members}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="progress mb-3" style={{ height: '25px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    role="progressbar"
                                                    style={{ width: `${Math.min(100, (team.current_members / team.members) * 100)}%` }}
                                                >
                                                    {team.current_members} / {team.members} Players
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h5 className="card-title border-bottom pb-2 mb-3">
                                        <i className="fa fa-users me-2"></i> Team Members
                                    </h5>
                                    
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Join Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {team.team_members && team.team_members.length > 0 ? (
                                                    team.team_members.map((member, idx) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                {member.first_name} {member.last_name}
                                                                {user?.id === member.player_id && (
                                                                    <span className="badge bg-success ms-2">You</span>
                                                                )}
                                                            </td>
                                                            <td>{member.email}</td>
                                                            <td>{new Date(member.joined_date).toLocaleDateString()}</td>
                                                            <td>
                                                                <span className={`badge bg-${member.status === 'active' ? 'success' : 'secondary'}`}>
                                                                    {member.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-center text-muted">
                                                            No team members information available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-info text-center">
                            <i className="fa fa-info-circle me-2"></i> 
                            You're not part of any teams yet. Browse teams to find one to join!
                        </div>
                        <div className="card bg-light mt-4">
                            <div className="card-body text-center">
                                <h5 className="card-title">
                                    <i className="fa fa-search me-2"></i> Find a Team
                                </h5>
                                <p className="card-text">Being part of a team enhances your sports experience.</p>
                                <Link to="/player/browse-teams" className="btn btn-primary mt-3">
                                    <i className="fa fa-search me-2"></i> Browse Available Teams
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTeams;
