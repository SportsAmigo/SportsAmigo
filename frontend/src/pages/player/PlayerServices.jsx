import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerLayout from '../../components/layout/PlayerLayout';
import vasService from '../../services/vasService';
import './Dashboard.css';
import './PlayerServices.css';

const PlayerServices = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [activeServices, setActiveServices] = useState({
    premium_profile: { active: false, service: null },
    performance_analytics: { active: false, service: null },
    player_insurance: { active: false, service: null }
  });

  const playerServices = [
    {
      id: 'premium_profile', name: 'Premium Player Profile', icon: '⭐',
      description: 'Stand out with a verified premium profile that showcases your achievements',
      price: 299, billingCycle: 'per year',
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      features: ['Verified Badge on your profile', 'Portfolio showcase with stats', 'Upload video highlights', 'Priority notifications for events', 'Custom profile URL', 'Higher visibility to scouts', 'Advanced privacy controls', 'Premium email support'],
      badge: 'Most Popular'
    },
    {
      id: 'performance_analytics', name: 'Performance Analytics', icon: '📊',
      description: 'Track your performance across events with detailed analytics and insights',
      price: 499, billingCycle: 'per year',
      gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      features: ['Detailed performance tracking', 'Stats comparison with peers', 'Strength and weakness analysis', 'Progress timeline visualization', 'Downloadable reports', 'Goal setting & tracking', 'AI-powered coaching insights', 'Share stats on social media'],
      badge: 'Pro Features'
    },
    {
      id: 'player_insurance', name: 'Player Insurance', icon: '🏥',
      description: 'Comprehensive sports injury insurance for peace of mind during events',
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      pricingTiers: [
        {
          plan: 'basic', name: 'Basic Plan', price: 1499, coverage: '₹50,000',
          features: ['Coverage up to ₹50,000', 'Accidental injury coverage', 'Hospitalization expenses', 'Emergency transport', '24/7 helpline', 'Valid for 1 year']
        },
        {
          plan: 'comprehensive', name: 'Comprehensive Plan', price: 1999, coverage: '₹1,00,000', recommended: true,
          features: ['Coverage up to ₹1,00,000', 'All Basic Plan features', 'Fracture & surgery coverage', 'Physiotherapy expenses', 'Dental care coverage', 'Pre-existing conditions (limited)', 'Valid for 1 year']
        }
      ]
    }
  ];

  const fetchActiveServices = useCallback(async () => {
    try {
      const [premium, analytics, insurance] = await Promise.all([
        vasService.checkVASStatus('premium_profile'),
        vasService.checkVASStatus('performance_analytics'),
        vasService.checkVASStatus('player_insurance')
      ]);

      setActiveServices({
        premium_profile: { active: Boolean(premium?.hasService), service: premium?.service || null },
        performance_analytics: { active: Boolean(analytics?.hasService), service: analytics?.service || null },
        player_insurance: { active: Boolean(insurance?.hasService), service: insurance?.service || null }
      });
    } catch (statusErr) {
      console.error('Failed to load active services:', statusErr);
    }
  }, []);

  useEffect(() => {
    fetchActiveServices();
  }, [fetchActiveServices]);

  const handlePurchaseClick = (service, tier = null) => {
    if (activeServices[service.id]?.active) {
      setSuccess(`${service.name} is already active on your account.`);
      setTimeout(() => setSuccess(''), 3500);
      return;
    }

    setSelectedService({ ...service, selectedTier: tier });
    setShowModal(true);
  };

  const handleProceedToPayment = () => {
    setShowModal(false);
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
    }, 180);
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      setError('');
      let response;
      switch (selectedService.id) {
        case 'premium_profile':
          response = await vasService.purchasePremiumProfile();
          break;
        case 'performance_analytics':
          response = await vasService.purchasePerformanceAnalytics();
          break;
        case 'player_insurance':
          response = await vasService.purchasePlayerInsurance(selectedService.selectedTier.plan);
          break;
        default:
          setError('Service not available');
          setLoading(false);
          return;
      }
      if (response.success) {
        const price = selectedService.selectedTier?.price || selectedService.price;
        const activatedServiceType = selectedService.id;

        setActiveServices((prev) => ({
          ...prev,
          [activatedServiceType]: {
            active: true,
            service: {
              serviceType: activatedServiceType,
              serviceDetails: activatedServiceType === 'player_insurance'
                ? { insurancePlan: selectedService.selectedTier?.plan || 'basic' }
                : {}
            }
          }
        }));

        const receiptData = {
          transactionId: `PLY${Date.now()}${Math.floor(Math.random()*1000)}`,
          service: selectedService.name,
          tier: selectedService.selectedTier?.name || '',
          amount: price,
          date: new Date().toLocaleString(),
          paymentMethod: 'Demo Payment',
          status: 'Success'
        };
        setReceipt(receiptData);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        fetchActiveServices();
      } else {
        setError(response.message || response.error || 'Purchase failed');
        setShowPaymentModal(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete purchase');
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    const content = `
═══════════════════════════════════
      SPORTSAMIGO PAYMENT RECEIPT
═══════════════════════════════════

Transaction ID: ${receipt.transactionId}
Date: ${receipt.date}
Status: ${receipt.status}

───────────────────────────────────
SERVICE PURCHASE DETAILS
───────────────────────────────────

Service: ${receipt.service}
${receipt.tier ? `Tier: ${receipt.tier}\n` : ''}Amount: ₹${receipt.amount.toLocaleString()}
Payment Method: ${receipt.paymentMethod}

═══════════════════════════════════
    Thank you for your purchase!
═══════════════════════════════════
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SportsAmigo_Receipt_${receipt.transactionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const crd = { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'all 0.3s' };
  const btn = (bg) => ({ padding: '0.75rem 1.5rem', border: 'none', borderRadius: 12, background: bg, color: 'white', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' });

  return (
    <PlayerLayout>
      <div className="player-services-page">
        {/* Header */}
        <div className="dashboard-header-section">
          <div className="dashboard-welcome-card">
            <div className="welcome-text">
              <h1>🌟 Upgrade Your Player Experience</h1>
              <p>Unlock premium features to enhance your sports journey</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '0 1.5rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          {/* Alerts */}
          {error && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 12, color: '#DC2626', marginBottom: '1rem', fontWeight: 500, backdropFilter: 'blur(10px)' }}>
              <i className="fa fa-exclamation-circle" style={{ marginRight: 8 }}></i>{error}
            </div>
          )}
          {success && !receipt && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, color: '#059669', marginBottom: '1rem', fontWeight: 500, backdropFilter: 'blur(10px)' }}>
              <i className="fa fa-check-circle" style={{ marginRight: 8 }}></i>{success}
            </div>
          )}

          {/* Services Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {playerServices.map(service => (
              <div key={service.id} style={{ ...crd, position: 'relative', overflow: 'hidden' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}
              >
                {service.badge && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: service.gradient, color: 'white', padding: '0.35rem 1rem', borderRadius: '0 16px 0 12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {service.badge}
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{service.icon}</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>{service.name}</h3>
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.5 }}>{service.description}</p>
                </div>

                {service.pricingTiers ? (
                  /* Insurance with two tiers */
                  <div>
                    {service.pricingTiers.map((tier, idx) => (
                      <div key={idx} style={{
                        padding: '1rem', marginBottom: '0.75rem', background: tier.recommended ? '#EFF6FF' : '#F9FAFB',
                        borderRadius: 12, border: tier.recommended ? '2px solid #2563EB' : '1px solid #E5E7EB', position: 'relative'
                      }}>
                        {tier.recommended && (
                          <span style={{ position: 'absolute', top: -10, right: 10, background: '#2563EB', color: 'white', padding: '0.2rem 0.75rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>Recommended</span>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#111827' }}>{tier.name}</div>
                            <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>Coverage: {tier.coverage}</div>
                          </div>
                          <div style={{ color: '#2563EB', fontWeight: 800, fontSize: '1.25rem' }}>₹{tier.price.toLocaleString()}<span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 400 }}>/yr</span></div>
                        </div>
                        {tier.features.map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0', color: '#374151', fontSize: '0.8rem' }}>
                            <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span> {f}
                          </div>
                        ))}
                        <button onClick={() => handlePurchaseClick(service, tier)} disabled={loading || activeServices.player_insurance.active}
                          style={{ ...btn(activeServices.player_insurance.active ? 'linear-gradient(135deg, #10B981, #059669)' : service.gradient), width: '100%', justifyContent: 'center', marginTop: '0.75rem', opacity: loading ? 0.5 : 1 }}>
                          <i className={`fa ${activeServices.player_insurance.active ? 'fa-check-circle' : 'fa-shopping-cart'}`}></i>
                          {activeServices.player_insurance.active
                            ? activeServices.player_insurance.service?.serviceDetails?.insurancePlan === tier.plan
                              ? 'Current Plan Active'
                              : 'Insurance Active'
                            : 'Select Plan'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Single price services */
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: '#111827' }}>₹{service.price}</span>
                      <span style={{ color: '#6B7280', fontSize: '0.9rem' }}> {service.billingCycle}</span>
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      {service.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', color: '#374151', fontSize: '0.875rem' }}>
                          <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span> {f}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handlePurchaseClick(service)} disabled={loading || activeServices[service.id]?.active}
                      style={{ ...btn(activeServices[service.id]?.active ? 'linear-gradient(135deg, #10B981, #059669)' : service.gradient), width: '100%', justifyContent: 'center', opacity: (loading || activeServices[service.id]?.active) ? 0.75 : 1 }}>
                      <i className={`fa ${activeServices[service.id]?.active ? 'fa-check-circle' : 'fa-shopping-cart'}`}></i>
                      {activeServices[service.id]?.active ? 'Activated' : 'Get Started'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Why Upgrade */}
          <div style={{ ...crd, marginTop: '1.5rem' }}>
            <h3 style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem' }}>🚀 Why Upgrade?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {[
                { icon: '🌟', title: 'Stand Out', desc: 'Get noticed by teams and scouts with premium features' },
                { icon: '📈', title: 'Track Progress', desc: 'Monitor your improvement with detailed analytics' },
                { icon: '🛡️', title: 'Stay Protected', desc: "Play with confidence knowing you're insured" }
              ].map((b, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '1.25rem', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{b.icon}</div>
                  <h4 style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>{b.title}</h4>
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Back button */}
          <div style={{ ...crd, marginTop: '1.5rem', textAlign: 'center' }}>
            <button onClick={() => navigate('/player/dashboard')}
              style={{ ...btn('linear-gradient(135deg, #6B7280, #4B5563)'), padding: '0.875rem 2rem', fontSize: '1rem' }}>
              <i className="fa fa-arrow-left"></i> Back to Dashboard
            </button>
          </div>
        </div>

        {/* Payment Processing Modal */}
        {showPaymentModal && selectedService && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 450, width: '90%', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{paymentProgress < 100 ? '💳' : '✅'}</div>
                <h2 style={{ color: '#111827', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                  {paymentProgress < 100 ? 'Processing Payment...' : 'Payment Successful!'}
                </h2>
                <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: 0 }}>
                  {paymentProgress < 100 ? 'Please wait while we process your payment' : 'Your service has been activated!'}
                </p>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Service:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{selectedService.name}</span>
                </div>
                {selectedService.selectedTier && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                    <span style={{ color: '#6B7280' }}>Plan:</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{selectedService.selectedTier.name}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', paddingTop: '0.75rem', borderTop: '2px solid #E5E7EB' }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>Amount:</span>
                  <span style={{ fontWeight: 800, color: '#2563EB' }}>₹{(selectedService.selectedTier?.price || selectedService.price).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6B7280' }}>Progress</span>
                  <span style={{ fontWeight: 600, color: '#2563EB' }}>{paymentProgress}%</span>
                </div>
                <div style={{ height: 8, background: '#E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #2563EB, #7C3AED)', width: `${paymentProgress}%`, transition: 'width 0.3s', borderRadius: 10 }}></div>
                </div>
              </div>
              {paymentProgress === 100 && (
                <div style={{ padding: '1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, textAlign: 'center' }}>
                  <p style={{ color: '#059669', margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>
                    <i className="fa fa-check-circle" style={{ marginRight: 6 }}></i>
                    Payment completed successfully
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && receipt && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001, backdropFilter: 'blur(6px)' }}
            onClick={() => { setShowReceiptModal(false); setSuccess(`Successfully purchased ${selectedService.name}!`); setTimeout(() => setSuccess(''), 5000); }}>
            <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 500, width: '90%', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ color: '#111827', marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Payment Receipt</h2>
                <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: 0 }}>Your service is now active!</p>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem', border: '2px dashed #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6B7280' }}>Transaction ID:</span>
                  <span style={{ fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>{receipt.transactionId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6B7280' }}>Date & Time:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6B7280' }}>Status:</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>✓ {receipt.status}</span>
                </div>
                <div style={{ height: 1, background: '#E5E7EB', margin: '1rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Service:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.service}</span>
                </div>
                {receipt.tier && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                    <span style={{ color: '#6B7280' }}>Plan:</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.tier}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Payment Method:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.paymentMethod}</span>
                </div>
                <div style={{ height: 2, background: '#2563EB', margin: '1rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>Total Amount:</span>
                  <span style={{ fontWeight: 800, color: '#2563EB' }}>₹{receipt.amount.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={downloadReceipt}
                  style={{
                    flex: 1, padding: '0.875rem', border: '1px solid #2563EB', borderRadius: 12,
                    background: 'white', color: '#2563EB', fontWeight: 600, fontSize: '0.9375rem',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.5rem'
                  }}>
                  <i className="fa fa-download"></i> Download Receipt
                </button>
                <button onClick={() => { setShowReceiptModal(false); setSuccess(`Successfully purchased ${selectedService.name}!`); setTimeout(() => setSuccess(''), 5000); navigate('/player/dashboard'); }}
                  style={{
                    flex: 1, padding: '0.875rem', border: 'none', borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white',
                    fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.2s'
                  }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Confirmation Modal */}
        {showModal && selectedService && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowModal(false); setError(''); setSuccess(''); }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '2rem', maxWidth: 520, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <h2 style={{ textAlign: 'center', color: '#111827', marginBottom: '1.5rem', fontSize: '1.375rem', fontWeight: 700 }}>
                🛍️ Confirm Purchase
              </h2>
                  <div style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: 12, marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{selectedService.icon}</div>
                    <h3 style={{ color: '#111827', fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>{selectedService.name}</h3>
                    {selectedService.selectedTier && (
                      <p style={{ color: '#6B7280', margin: '0 0 0.5rem' }}>{selectedService.selectedTier.name}</p>
                    )}
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB' }}>
                      ₹{(selectedService.selectedTier?.price || selectedService.price).toLocaleString()}
                      <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 400 }}> /year</span>
                    </div>
                  </div>
                  {/* Payment info */}
                  <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: 10, marginBottom: '1.5rem', border: '1px solid #FDE68A' }}>
                    <p style={{ color: '#92400E', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
                      <i className="fa fa-info-circle" style={{ marginRight: 6 }}></i>
                      Demo payment — no actual charges will be made.
                    </p>
                  </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleProceedToPayment} disabled={loading}
                  style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: 12, background: selectedService.gradient || 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Processing...' : '💳 Proceed to Payment'}
                </button>
                <button onClick={() => { setShowModal(false); setError(''); }}
                  style={{ flex: 1, padding: '0.875rem', border: '1px solid #D1D5DB', borderRadius: 12, background: 'white', color: '#374151', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlayerLayout>
  );
};

export default PlayerServices;
