import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import subscriptionService from '../../services/subscriptionService';
import { updateUserData } from '../../store/slices/authSlice';
import './OrganizerDashboard.css';

const SubscriptionManagement = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('yearly');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentProgress, setPaymentProgress] = useState(0);

  const plans = {
    free: {
      name: 'Free Plan', monthly: 0, yearly: 0, commissionRate: '20%',
      features: [
        'Up to 3 events per month',
        'Up to 16 teams per event',
        '20% platform commission',
        'Basic dashboard stats',
        'Standard prices on all VAS',
        'Standard placement in event browse'
      ],
      gradient: 'linear-gradient(135deg, #6B7280, #4B5563)'
    },
    pro: {
      name: 'Pro Plan', monthly: 2999, yearly: 29999, commissionRate: '15%',
      savings: 'Save ₹6,389/year', popular: true,
      features: [
        'Unlimited events per month',
        'Up to 64 teams per event',
        '15% commission — save more per event',
        'Export participant list as CSV',
        'Export match results as CSV',
        'Revenue and earnings charts in dashboard',
        'Event QR code for sharing and printing',
        '10% discount on all VAS purchases',
        'Gold ⚡ Pro Organizer badge on all event listings',
        'Higher placement in player event browse'
      ],
      gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)'
    },
    enterprise: {
      name: 'Enterprise Plan', monthly: 9999, yearly: 99999, commissionRate: '12%',
      savings: 'Save ₹19,989/year',
      features: [
        'Everything in Pro, plus:',
        'Unlimited teams per event',
        '12% commission — lowest rate on the platform',
        '20% discount on all VAS purchases',
        'Purple ★ Enterprise Organizer badge — highest trust signal',
        'Top placement in all event browse and search results'
      ],
      gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)'
    }
  };

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.getCurrentSubscription();
      if (res.success) setCurrentSubscription(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const handleUpgradeClick = (planKey) => {
    if (planKey === 'free') return;
    setSelectedPlan(planKey);
    setShowUpgradeModal(true);
  };

  const handleProceedToPayment = () => {
    setShowUpgradeModal(false);
    setShowPaymentModal(true);
    setPaymentProgress(0);
    simulatePayment();
  };

  const simulatePayment = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setPaymentProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => processPayment(), 300);
      }
    }, 200);
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      setError('');
      const currentPlanKey = currentSubscription?.plan || 'free';
      const isUpgrade = currentPlanKey !== 'free';
      const res = isUpgrade
        ? await subscriptionService.upgrade(selectedPlan, billingCycle)
        : await subscriptionService.purchase(selectedPlan, billingCycle);

      if (res.success) {
        setReceipt(res.receipt);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        // Update Redux user state so sidebar badge updates immediately
        dispatch(updateUserData({ subscription: { plan: selectedPlan, status: 'active' } }));
        fetchSubscription();
      } else {
        setError(res.message || 'Payment failed. Please try again.');
        setShowPaymentModal(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to process subscription');
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceiptPDF = () => {
    if (!receipt?.transactionId) return;
    const url = subscriptionService.getReceiptURL(receipt.transactionId);
    window.open(url, '_blank');
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Cancel your subscription? You will be downgraded to the Free plan at end of billing.')) return;
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/subscription/cancel', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.success) { setSuccess('Subscription cancelled. Access continues until end of billing period.'); fetchSubscription(); }
      else setError(data.message || 'Failed to cancel');
    } catch (err) { setError(err.message || 'Failed to cancel'); }
    finally { setLoading(false); }
  };

  const currentPlan = currentSubscription?.plan || 'free';
  const daysRemaining = currentSubscription?.daysRemaining;
  const getPrice = (planKey) => billingCycle === 'yearly' ? plans[planKey].yearly : plans[planKey].monthly;
  const crd = { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' };

  return (
    <OrganizerLayout>
      <div className="organizer-main-content">
        <div className="dashboard-header-section">
          <div className="dashboard-welcome-card">
            <div className="welcome-text">
              <h1><i className="fas fa-gem" style={{ marginRight: 10, color: '#7C3AED' }}></i>Subscription Plans</h1>
              <p>Choose the perfect plan for your organization</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          {error && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 12, color: '#DC2626', marginBottom: '1rem', fontWeight: 500 }}>
              <i className="fa fa-exclamation-circle" style={{ marginRight: 8 }}></i>{error}
              <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
            </div>
          )}
          {success && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, color: '#059669', marginBottom: '1rem', fontWeight: 500 }}>
              <i className="fa fa-check-circle" style={{ marginRight: 8 }}></i>{success}
              <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
            </div>
          )}

          {/* Active Subscription Badge Banner */}
          {currentSubscription && currentPlan !== 'free' && (
            <div style={{ ...crd, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderLeft: `4px solid ${currentPlan === 'pro' ? '#2563EB' : '#7C3AED'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: currentPlan === 'pro' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'linear-gradient(135deg, #7C3AED, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-crown" style={{ fontSize: '1.25rem', color: 'white' }}></i>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, color: '#111827', fontWeight: 700 }}>{plans[currentPlan].name} ({currentSubscription.billingCycle || 'monthly'}) — Active</h3>
                    <span style={{ padding: '0.2rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                      <i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>Active
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem', color: '#6B7280', fontSize: '0.875rem' }}>
                    {currentSubscription.endDate && <span>Expires: {new Date(currentSubscription.endDate).toLocaleDateString()}</span>}
                    {daysRemaining !== undefined && (
                      <span style={{ color: daysRemaining < 7 ? '#DC2626' : '#059669', fontWeight: 600 }}>{daysRemaining} days remaining</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={handleCancelSubscription} disabled={loading}
                style={{ padding: '0.625rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel Subscription
              </button>
            </div>
          )}

          {/* Billing Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '0.3rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
              <button onClick={() => setBillingCycle('monthly')} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9375rem', transition: 'all 0.2s', background: billingCycle === 'monthly' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'transparent', color: billingCycle === 'monthly' ? 'white' : '#6B7280', boxShadow: billingCycle === 'monthly' ? '0 4px 12px rgba(37,99,235,0.3)' : 'none' }}>Monthly</button>
              <button onClick={() => setBillingCycle('yearly')} style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9375rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', background: billingCycle === 'yearly' ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'transparent', color: billingCycle === 'yearly' ? 'white' : '#6B7280', boxShadow: billingCycle === 'yearly' ? '0 4px 12px rgba(37,99,235,0.3)' : 'none' }}>
                Yearly <span style={{ background: billingCycle === 'yearly' ? 'rgba(255,255,255,0.25)' : '#10B981', color: 'white', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>Save 17%</span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {Object.keys(plans).map(planKey => {
              const plan = plans[planKey];
              const isCurrent = planKey === currentPlan;
              const price = getPrice(planKey);
              return (
                <div key={planKey} style={{ ...crd, position: 'relative', border: isCurrent ? '2px solid #10B981' : plan.popular ? '2px solid #2563EB' : '1px solid rgba(255,255,255,0.3)', transform: plan.popular && !isCurrent ? 'scale(1.02)' : 'none', transition: 'all 0.3s' }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = plan.popular && !isCurrent ? 'scale(1.02)' : 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}>
                  {plan.popular && !isCurrent && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', padding: '0.35rem 1rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>Most Popular</div>}
                  {isCurrent && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', padding: '0.35rem 1rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}><i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>Current Plan</div>}

                  <div style={{ textAlign: 'center', paddingTop: (plan.popular || isCurrent) ? '0.5rem' : 0, marginBottom: '1.25rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 0.75rem', background: planKey === 'free' ? '#F3F4F6' : plan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fas ${planKey === 'free' ? 'fa-user' : planKey === 'pro' ? 'fa-star' : 'fa-building'}`} style={{ fontSize: '1.5rem', color: planKey === 'free' ? '#6B7280' : 'white' }}></i>
                    </div>
                    <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', margin: '0 0 1rem' }}>{plan.name}</h2>
                    {price === 0 ? <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6B7280' }}>Free Forever</div> : (
                      <div><span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827' }}>₹{price.toLocaleString()}</span><span style={{ color: '#6B7280', fontSize: '1rem' }}>/{billingCycle}</span></div>
                    )}
                    {plan.savings && billingCycle === 'yearly' && <div style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.5rem' }}>{plan.savings}</div>}
                  </div>

                  <div style={{ textAlign: 'center', padding: '0.75rem', background: '#F9FAFB', borderRadius: 10, marginBottom: '1.25rem', border: '1px solid #E5E7EB' }}>
                    <span style={{ fontWeight: 700, color: '#2563EB', fontSize: '1.125rem' }}>{plan.commissionRate}</span>
                    <span style={{ color: '#6B7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>Commission Rate</span>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    {plan.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.4rem 0', color: '#374151', fontSize: '0.875rem' }}>
                        <i className="fas fa-check" style={{ color: '#10B981', fontSize: '0.75rem', marginTop: 3 }}></i>
                        <span style={{ lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => handleUpgradeClick(planKey)} disabled={isCurrent || loading || planKey === 'free'}
                    style={{ width: '100%', padding: '0.875rem', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: (isCurrent || planKey === 'free') ? 'default' : 'pointer', background: isCurrent ? '#E5E7EB' : plan.gradient, color: isCurrent ? '#9CA3AF' : 'white', boxShadow: (isCurrent || planKey === 'free') ? 'none' : '0 4px 16px rgba(0,0,0,0.2)', opacity: loading ? 0.5 : 1, transition: 'all 0.2s' }}>
                    {isCurrent ? <><i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>Current Plan</> : planKey === 'free' ? 'Free Plan' : <><i className="fas fa-arrow-up" style={{ marginRight: 6 }}></i>Upgrade Now</>}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div style={crd}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem', textAlign: 'center' }}>
              <i className="fas fa-question-circle" style={{ marginRight: 8, color: '#2563EB' }}></i>Frequently Asked Questions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {[
                { q: 'Can I change plans anytime?', a: 'Yes! Upgrade or downgrade at any time. Changes take effect immediately.' },
                { q: 'What happens if I cancel?', a: "You retain access until the end of your billing period, then you'll be moved to the Free plan." },
                { q: 'How does commission work?', a: 'We deduct a percentage from each event registration. Higher plans = lower commission = more earnings!' }
              ].map((faq, i) => (
                <div key={i} style={{ padding: '1.25rem', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>{faq.q}</h4>
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Processing Modal */}
        {showPaymentModal && selectedPlan && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 450, width: '90%', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: paymentProgress < 100 ? '#EFF6FF' : '#ECFDF5' }}>
                  <i className={`fas ${paymentProgress < 100 ? 'fa-spinner fa-spin' : 'fa-check-circle'}`} style={{ fontSize: '1.75rem', color: paymentProgress < 100 ? '#2563EB' : '#10B981' }}></i>
                </div>
                <h2 style={{ color: '#111827', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>{paymentProgress < 100 ? 'Processing Payment...' : 'Payment Successful!'}</h2>
                <p style={{ color: '#6B7280', margin: 0 }}>{paymentProgress < 100 ? 'Please wait while we process your payment' : 'Your subscription has been activated!'}</p>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}><span style={{ color: '#6B7280' }}>Plan:</span><span style={{ fontWeight: 600 }}>{plans[selectedPlan].name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}><span style={{ color: '#6B7280' }}>Billing:</span><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{billingCycle}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid #E5E7EB', fontSize: '1.125rem' }}><span style={{ fontWeight: 600 }}>Amount:</span><span style={{ fontWeight: 800, color: '#2563EB' }}>₹{getPrice(selectedPlan).toLocaleString()}</span></div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}><span style={{ color: '#6B7280' }}>Progress</span><span style={{ fontWeight: 600, color: '#2563EB' }}>{paymentProgress}%</span></div>
                <div style={{ height: 8, background: '#E5E7EB', borderRadius: 10, overflow: 'hidden' }}><div style={{ height: '100%', background: 'linear-gradient(90deg, #2563EB, #1D4ED8)', width: `${paymentProgress}%`, transition: 'width 0.3s', borderRadius: 10 }}></div></div>
              </div>
              {paymentProgress === 100 && <div style={{ padding: '1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, textAlign: 'center' }}><p style={{ color: '#059669', margin: 0, fontWeight: 600 }}><i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>Payment completed successfully</p></div>}
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && receipt && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001, backdropFilter: 'blur(6px)' }}
            onClick={() => { setShowReceiptModal(false); setSuccess(`Your ${plans[selectedPlan].name} (${billingCycle}) has been activated successfully.`); setTimeout(() => setSuccess(''), 6000); }}>
            <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 500, width: '90%', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECFDF5' }}><i className="fas fa-receipt" style={{ fontSize: '1.75rem', color: '#10B981' }}></i></div>
                <h2 style={{ color: '#111827', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Payment Receipt</h2>
                <p style={{ color: '#6B7280', margin: 0 }}>Your subscription is now active!</p>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', border: '2px dashed #E5E7EB' }}>
                {[['Transaction ID', receipt.transactionId, true], ['Date & Time', new Date(receipt.dateTime).toLocaleString()], ['Status', receipt.paymentStatus]].map(([l, v, mono], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6B7280' }}>{l}:</span>
                    <span style={{ fontWeight: 600, color: l === 'Status' ? '#10B981' : '#111827', fontFamily: mono ? 'monospace' : 'inherit' }}>{l === 'Status' && <i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>}{v}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: '#E5E7EB', margin: '1rem 0' }}></div>
                {[['Plan', receipt.planOrPackage], ['Billing Cycle', (receipt.billingCycle || '').charAt(0).toUpperCase() + (receipt.billingCycle || '').slice(1)], ['Organizer', receipt.organizerName]].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}><span style={{ color: '#6B7280' }}>{l}:</span><span style={{ fontWeight: 600, color: '#111827' }}>{v}</span></div>
                ))}
                <div style={{ height: 2, background: '#2563EB', margin: '1rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem' }}><span style={{ fontWeight: 700, color: '#111827' }}>Total Amount:</span><span style={{ fontWeight: 800, color: '#2563EB' }}>₹{Number(receipt.amount).toLocaleString()}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={downloadReceiptPDF} style={{ flex: 1, padding: '0.875rem', border: '1px solid #2563EB', borderRadius: 12, background: 'white', color: '#2563EB', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><i className="fa fa-file-pdf"></i> Download PDF</button>
                <button onClick={() => { setShowReceiptModal(false); setSuccess(`Your ${plans[selectedPlan].name} (${billingCycle}) has been activated successfully.`); setTimeout(() => setSuccess(''), 6000); }}
                  style={{ flex: 1, padding: '0.875rem', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Confirmation Modal */}
        {showUpgradeModal && selectedPlan && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} onClick={() => setShowUpgradeModal(false)}>
            <div style={{ background: 'white', borderRadius: 16, padding: '2rem', maxWidth: 500, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ textAlign: 'center', color: '#111827', marginBottom: '1.5rem', fontSize: '1.375rem', fontWeight: 700 }}>
                <i className="fas fa-rocket" style={{ marginRight: 8, color: '#2563EB' }}></i>Confirm {currentPlan !== 'free' ? 'Switch' : 'Upgrade'}
              </h2>
              <div style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: 12, marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 0.75rem', background: plans[selectedPlan].gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${selectedPlan === 'pro' ? 'fa-star' : 'fa-building'}`} style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
                <h3 style={{ color: '#111827', fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.75rem' }}>{plans[selectedPlan].name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563EB' }}>₹{getPrice(selectedPlan).toLocaleString()}<span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 400 }}>/{billingCycle}</span></div>
                {billingCycle === 'yearly' && plans[selectedPlan].savings && <p style={{ color: '#10B981', fontWeight: 600, margin: '0.5rem 0 0' }}>{plans[selectedPlan].savings}</p>}
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#EFF6FF', borderRadius: 8 }}><span style={{ color: '#2563EB', fontWeight: 600 }}>New commission rate: {plans[selectedPlan].commissionRate}</span></div>
              </div>
              <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: 10, marginBottom: '1.5rem', border: '1px solid #FDE68A' }}>
                <p style={{ color: '#92400E', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}><i className="fa fa-info-circle" style={{ marginRight: 6 }}></i>This is a demo payment — no actual charges will be made.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleProceedToPayment} disabled={loading} style={{ flex: 1, padding: '0.875rem', border: 'none', borderRadius: 12, background: plans[selectedPlan].gradient, color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>
                <button onClick={() => setShowUpgradeModal(false)} disabled={loading} style={{ flex: 1, padding: '0.875rem', border: '1px solid #D1D5DB', borderRadius: 12, background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default SubscriptionManagement;
