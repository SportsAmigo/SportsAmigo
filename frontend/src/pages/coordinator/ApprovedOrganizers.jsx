import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaClipboardList } from 'react-icons/fa';
import CoordinatorLayout from '../../components/layout/CoordinatorLayout';
import apiService from '../../services/apiService';

const ApprovedOrganizers = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApproved = async () => {
            try {
                const res = await apiService.get('/coordinator/approved-organizers');
                if (res.success) setOrganizers(res.data || []);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchApproved();
    }, []);

    return (
        <CoordinatorLayout>
            <div className="dashboard-page-wrapper">
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1><FaCheckCircle style={{ verticalAlign: 'middle', marginRight: '8px', color: '#10B981' }} /> Approved Organizers ({organizers.length})</h1>
                            <p>Monitor verified organizers and their performance</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    {loading ? (
                        <div className="coord-loading"><i className="fa fa-spinner fa-spin"></i><p>Loading...</p></div>
                    ) : organizers.length === 0 ? (
                        <div className="coord-empty">
                            <div className="empty-icon"><FaClipboardList style={{ fontSize: '4rem', color: '#9CA3AF' }} /></div>
                            <h3>No approved organizers yet</h3>
                            <p>Approved organizers will appear here.</p>
                        </div>
                    ) : (
                        <div className="section-card" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Organization</th>
                                        <th>Approved</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {organizers.map(org => (
                                        <tr key={org._id}>
                                            <td><strong>{org.first_name} {org.last_name}</strong></td>
                                            <td>{org.email}</td>
                                            <td>{org.profile?.organization_name || '—'}</td>
                                            <td>{org.verificationDocuments?.reviewedAt ? new Date(org.verificationDocuments.reviewedAt).toLocaleDateString() : '—'}</td>
                                            <td><span className="status-pill verified">Verified</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </CoordinatorLayout>
    );
};

export default ApprovedOrganizers;
