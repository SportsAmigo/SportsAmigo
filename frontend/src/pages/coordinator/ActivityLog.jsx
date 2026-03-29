import React, { useState, useEffect } from 'react';
import { FaClipboardList } from 'react-icons/fa';
import CoordinatorLayout from '../../components/layout/CoordinatorLayout';
import apiService from '../../services/apiService';

const ActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await apiService.get('/coordinator/activity-log');
                if (res.success) setLogs(res.data || []);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter);

    return (
        <CoordinatorLayout>
            <div className="dashboard-page-wrapper">
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1><FaClipboardList style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Activity Log</h1>
                            <p>Audit trail of all coordinator actions</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <div className="filter-bar">
                        <select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Actions</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="requested_info">Requested Info</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="coord-loading"><i className="fa fa-spinner fa-spin"></i><p>Loading activity...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="coord-empty">
                            <div className="empty-icon"><FaClipboardList style={{ fontSize: '4rem', color: '#9CA3AF' }} /></div>
                            <h3>No activity yet</h3>
                            <p>Coordinator actions will appear here as they happen.</p>
                        </div>
                    ) : (
                        <div className="section-card" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date/Time</th>
                                        <th>Action</th>
                                        <th>Target</th>
                                        <th>Details</th>
                                        <th>Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((log, idx) => (
                                        <tr key={idx}>
                                            <td>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                                            <td>
                                                <span className={`status-pill ${log.action === 'approved' ? 'approved' : log.action === 'rejected' ? 'rejected' : 'pending'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>{log.targetType}: <strong>{log.targetName}</strong></td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details || '—'}</td>
                                            <td>{log.result || 'Success'}</td>
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

export default ActivityLog;
