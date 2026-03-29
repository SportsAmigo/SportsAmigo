import React, { useState, useEffect, useCallback } from 'react';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import subscriptionService from '../../services/subscriptionService';
import vasServiceV1 from '../../services/vasServiceV1';
import './OrganizerDashboard.css';

const PaymentHistory = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [vasHistory, setVasHistory] = useState([]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, vasRes] = await Promise.all([
        subscriptionService.getHistory(),
        vasServiceV1.getHistory()
      ]);
      if (subRes.success) setSubscriptionHistory(subRes.data || []);
      if (vasRes.success) setVasHistory(vasRes.data || []);
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const allTransactions = [
    ...subscriptionHistory.map(t => ({ ...t, category: 'Subscription' })),
    ...vasHistory.map(t => ({ ...t, category: 'VAS' }))
  ].sort((a, b) => new Date(b.date || b.dateTime || b.paidAt) - new Date(a.date || a.dateTime || a.paidAt));

  const filtered = activeTab === 'all' ? allTransactions
    : activeTab === 'subscription' ? allTransactions.filter(t => t.category === 'Subscription')
    : allTransactions.filter(t => t.category === 'VAS');

  const downloadReceipt = (txn) => {
    const url = txn.category === 'Subscription'
      ? subscriptionService.getReceiptURL(txn.transactionId)
      : vasServiceV1.getReceiptURL(txn.transactionId);
    window.open(url, '_blank');
  };

  const statusBadge = (status) => {
    const s = (status || '').toUpperCase();
    const map = {
      SUCCESS: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', icon: 'fa-check-circle' },
      PENDING: { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', icon: 'fa-clock' },
      FAILED: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', icon: 'fa-times-circle' },
      CANCELLED: { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB', icon: 'fa-ban' },
    };
    const cfg = map[s] || map.PENDING;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
        <i className={`fas ${cfg.icon}`}></i>{s}
      </span>
    );
  };

  const crd = {
    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 16,
    padding: '1.75rem', border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
  };

  const totalSpent = allTransactions.filter(t => (t.status || t.paymentStatus || '').toUpperCase() === 'SUCCESS')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <OrganizerLayout>
      <div className="organizer-main-content">
        <div className="dashboard-header-section">
          <div className="dashboard-welcome-card">
            <div className="welcome-text">
              <h1><i className="fas fa-receipt" style={{ marginRight: 10, color: '#2563EB' }}></i>Payment History</h1>
              <p>View all your subscription and VAS payment transactions</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Transactions', value: allTransactions.length, icon: 'fa-exchange-alt', color: '#2563EB' },
              { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: 'fa-wallet', color: '#10B981' },
              { label: 'Subscriptions', value: subscriptionHistory.length, icon: 'fa-crown', color: '#7C3AED' },
              { label: 'VAS Purchases', value: vasHistory.length, icon: 'fa-cubes', color: '#F59E0B' }
            ].map((card, i) => (
              <div key={i} style={{ ...crd, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${card.icon}`} style={{ fontSize: '1.1rem', color: card.color }}></i>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>{card.label}</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>{card.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { key: 'all', label: 'All', count: allTransactions.length },
              { key: 'subscription', label: 'Subscriptions', count: subscriptionHistory.length },
              { key: 'vas', label: 'VAS', count: vasHistory.length }
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.625rem 1.25rem', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'rgba(255,255,255,0.9)',
                  color: activeTab === tab.key ? 'white' : '#6B7280',
                  boxShadow: activeTab === tab.key ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s'
                }}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <div style={{ ...crd, padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.75rem', display: 'block' }}></i>
                Loading payment history...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                <i className="fas fa-inbox" style={{ fontSize: '2rem', marginBottom: '0.75rem', display: 'block', color: '#D1D5DB' }}></i>
                <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>No transactions found</p>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Payments will appear here after you make a purchase.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                      {['Date', 'Type', 'Item', 'Amount', 'Status', 'Transaction ID', 'Receipt'].map(h => (
                        <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((txn, idx) => (
                      <tr key={txn.transactionId || idx}
                        style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '0.875rem 1rem', color: '#374151', whiteSpace: 'nowrap' }}>
                          {new Date(txn.date || txn.dateTime || txn.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                            background: txn.category === 'Subscription' ? '#EDE9FE' : '#FEF3C7',
                            color: txn.category === 'Subscription' ? '#7C3AED' : '#D97706'
                          }}>
                            <i className={`fas ${txn.category === 'Subscription' ? 'fa-crown' : 'fa-cube'}`}></i>
                            {txn.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#111827' }}>
                          {txn.category === 'VAS' ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {txn.item ? txn.item.split(' — ')[0] : (txn.serviceType || '—')}
                              </div>
                              {txn.eventName && txn.eventName !== 'Unknown' && (
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <i className="fas fa-calendar-alt" style={{ color: '#2563EB', fontSize: '0.65rem' }}></i>
                                  {txn.eventName}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontWeight: 600 }}>
                              {txn.plan || txn.planOrPackage || txn.item || '—'}
                              {txn.billingCycle && <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: 4 }}>({txn.billingCycle})</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#111827' }}>₹{(txn.amount || 0).toLocaleString()}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>{statusBadge(txn.status || txn.paymentStatus)}</td>
                        <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#6B7280' }}>{txn.transactionId || '—'}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {(txn.status || txn.paymentStatus || '').toUpperCase() === 'SUCCESS' && txn.transactionId ? (
                            <button onClick={() => downloadReceipt(txn)}
                              style={{ padding: '0.4rem 0.75rem', border: '1px solid #2563EB', borderRadius: 8, background: 'white', color: '#2563EB', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <i className="fas fa-file-pdf"></i> PDF
                            </button>
                          ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default PaymentHistory;
