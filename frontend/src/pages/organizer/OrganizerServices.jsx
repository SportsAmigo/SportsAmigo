import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import vasServiceV1 from '../../services/vasServiceV1';
import './OrganizerDashboard.css';

const OrganizerServices = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const organizerPlan = user?.subscription?.plan || 'free';
  const VAS_DISCOUNT = { free: 1.0, pro: 0.90, enterprise: 0.80 };
  const vasDiscount = VAS_DISCOUNT[organizerPlan] ?? 1.0;
  const discountedPrice = (price) => Math.round(price * vasDiscount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [eventVAS, setEventVAS] = useState([]);

  const organizerServices = [
    {
      id: 'event_insurance', name: 'Event Insurance', iconClass: 'fas fa-shield-alt', iconColor: '#2563EB',
      description: 'Protect your event from weather cancellations, liability claims, and unforeseen circumstances',
      pricing: [
        { type: 'basic', name: 'Basic Coverage', price: 2999, coverage: '₹1,00,000' },
        { type: 'standard', name: 'Standard Coverage', price: 4999, coverage: '₹2,50,000' },
        { type: 'premium', name: 'Premium Coverage', price: 9999, coverage: '₹5,00,000' }
      ],
      features: ['Weather cancellation coverage', 'Liability protection', 'Participant injury coverage', '24/7 claim support']
    },
    {
      id: 'photography_booking', name: 'Professional Photography', iconClass: 'fas fa-camera', iconColor: '#7C3AED',
      description: 'Book professional photographers to capture your event moments',
      pricing: [
        { type: 'basic', name: 'Basic Package', price: 4999, hours: '2-3 hours' },
        { type: 'standard', name: 'Standard Package', price: 9999, hours: '4-6 hours' },
        { type: 'premium', name: 'Premium Package', price: 19999, hours: 'Full day + drone' }
      ],
      features: ['Professional photographer', 'Edited photos within 48 hours', 'Online gallery', 'High-resolution downloads']
    },
    {
      id: 'marketing_boost', name: 'Marketing Boost', iconClass: 'fas fa-bullhorn', iconColor: '#F59E0B',
      description: 'Promote your event to thousands of potential participants',
      pricing: [
        { type: 'basic', name: 'Basic Boost', price: 999, impressions: '5,000' },
        { type: 'standard', name: 'Standard Boost', price: 1999, impressions: '15,000' },
        { type: 'premium', name: 'Premium Boost', price: 4999, impressions: '50,000' }
      ],
      features: ['Targeted social media ads', 'Email campaign to relevant users', 'Featured placement on homepage', 'Performance analytics']
    },
    {
      id: 'certificate_generation', name: 'Certificate Generation', iconClass: 'fas fa-certificate', iconColor: '#10B981',
      description: 'Professional digital certificates for participants',
      pricing: [
        { type: 'basic', name: 'Basic Certificates', price: 10, perUnit: 'per certificate' },
        { type: 'standard', name: 'Standard (50+)', price: 7, perUnit: 'per certificate' },
        { type: 'premium', name: 'Premium (100+)', price: 5, perUnit: 'per certificate' }
      ],
      features: ['Custom branded design', 'Digital signatures', 'Automatic email delivery', 'Blockchain verification (premium)']
    },
    {
      id: 'sms_notifications', name: 'SMS Notifications', iconClass: 'fas fa-sms', iconColor: '#EF4444',
      description: 'Send bulk SMS notifications to participants',
      pricing: [
        { type: '100', name: '100 SMS', price: 100, rate: '₹1.00/SMS' },
        { type: '500', name: '500 SMS', price: 450, rate: '₹0.90/SMS' },
        { type: '1000', name: '1000 SMS', price: 800, rate: '₹0.80/SMS' }
      ],
      features: ['Instant delivery', 'Delivery reports', 'Scheduled messaging', 'Custom templates']
    }
  ];

  useEffect(() => { fetchMyEvents(); }, []);

  useEffect(() => {
    if (!selectedEvent) { setEventVAS([]); return; }
    vasServiceV1.getEventVAS(selectedEvent)
      .then(res => { if (res.success) setEventVAS(res.data || []); })
      .catch(() => {});
  }, [selectedEvent]);

  // Infer tier type ('basic'/'standard'/'premium'/etc.) from a raw VAS document
  const inferTierFromVAS = (vasDoc) => {
    const st = vasDoc.serviceType;
    const sd = vasDoc.serviceDetails || {};
    if (st === 'event_insurance') return sd.insuranceType || null;
    if (st === 'marketing_boost') return sd.boostType || null;
    if (st === 'photography_booking') {
      if ((sd.photosCount || 0) >= 200) return 'premium';
      if ((sd.photosCount || 0) >= 100) return 'standard';
      return 'basic';
    }
    if (st === 'sms_notifications') return String(sd.smsCount || '100');
    if (st === 'certificate_generation') {
      if ((sd.certificateCount || 0) >= 100) return 'premium';
      if ((sd.certificateCount || 0) >= 50) return 'standard';
      return 'basic';
    }
    return null;
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const data = await vasServiceV1.getMyEvents();
      if (data.success) {
        const events = (data.events || []).map(e => ({
          _id: e._id,
          title: e.name || e.title,
          event_date: e.start_date || e.event_date
        }));
        setMyEvents(events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (service, tier) => {
    if (!selectedEvent) {
      setError('Please select an event first');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setSelectedService(service);
    setSelectedTier(tier);
    setShowPurchaseModal(true);
  };

  const handleProceedToPayment = () => {
    setShowPurchaseModal(false);
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
      const quantity = selectedService.id === 'certificate_generation' ? 50 : 1;
      const response = await vasServiceV1.purchaseVAS(
        selectedEvent,
        selectedService.id,
        selectedTier.type,
        quantity
      );
      if (response.success) {
        setReceipt(response.receipt || {
          transactionId: response.transactionId || `VAS${Date.now()}`,
          service: selectedService.name,
          tier: selectedTier.name,
          amount: selectedTier.price,
          event: myEvents.find(e => e._id === selectedEvent)?.title || 'Selected Event',
          dateTime: new Date().toISOString(),
          paymentStatus: 'SUCCESS'
        });
        // Refresh active VAS for this event
        vasServiceV1.getEventVAS(selectedEvent)
          .then(res => { if (res.success) setEventVAS(res.data || []); })
          .catch(() => {});
        setShowPaymentModal(false);
        setShowReceiptModal(true);
      } else {
        setError(response.message || 'Purchase failed');
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
    if (receipt?.transactionId) {
      const url = vasServiceV1.getReceiptURL(receipt.transactionId);
      window.open(url, '_blank');
    }
  };

  // Card styles
  const crd = { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'all 0.3s' };
  const btn = (bg) => ({ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 10, background: bg, color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' });

  return (
    <OrganizerLayout>
      <div className="organizer-main-content">
        {/* Header */}
        <div className="dashboard-header-section">
          <div className="dashboard-welcome-card">
            <div className="welcome-text">
              <h1><i className="fas fa-cubes" style={{ marginRight: 10, color: '#2563EB' }}></i>Value-Added Services</h1>
              <p>Enhance your events with professional services and tools</p>
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
          {success && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, color: '#059669', marginBottom: '1rem', fontWeight: 500, backdropFilter: 'blur(10px)' }}>
              <i className="fa fa-check-circle" style={{ marginRight: 8 }}></i>{success}
            </div>
          )}

          {/* Event Selector */}
          <div style={{ ...crd, marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#111827', marginBottom: '0.75rem', fontSize: '1rem' }}>
              <i className="fa fa-calendar-alt" style={{ marginRight: 8, color: '#2563EB' }}></i>
              Select Event to Purchase Services For:
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              style={{
                width: '100%', padding: '0.875rem 1rem', border: '2px solid #E5E7EB', borderRadius: 10,
                fontSize: '0.9375rem', fontFamily: 'inherit', background: 'white', color: '#374151',
                cursor: 'pointer', transition: 'border-color 0.2s', appearance: 'auto'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563EB'}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            >
              <option value="">-- Select an event --</option>
              {myEvents.map(event => (
                <option key={event._id} value={event._id}>
                  {event.title} — {new Date(event.event_date).toLocaleDateString()}
                </option>
              ))}
            </select>
            {myEvents.length === 0 && !loading && (
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                <i className="fa fa-info-circle" style={{ marginRight: 6 }}></i>
                No events found. <a href="/organizer/create-event" style={{ color: '#2563EB', textDecoration: 'underline' }}>Create an event</a> first to purchase services.
              </p>
            )}
          </div>

          {/* Services Grid */}
          {vasDiscount < 1 && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1.25rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.75rem', background: organizerPlan === 'enterprise' ? 'rgba(124,58,237,0.08)' : 'rgba(245,158,11,0.1)', border: `1px solid ${organizerPlan === 'enterprise' ? 'rgba(124,58,237,0.25)' : 'rgba(245,158,11,0.3)'}` }}>
              <i className={`fas fa-tag`} style={{ color: organizerPlan === 'enterprise' ? '#7C3AED' : '#D97706', fontSize: '1.1rem' }}></i>
              <span style={{ fontWeight: 600, color: organizerPlan === 'enterprise' ? '#6D28D9' : '#92400E', fontSize: '0.9rem' }}>
                {organizerPlan === 'enterprise' ? '★ Enterprise 20% VAS discount applied to all prices!' : '⚡ Pro 10% VAS discount applied to all prices!'}
              </span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {organizerServices.map(service => (
              <div key={service.id} style={crd}>
                {/* Service Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '2px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 0.5rem', background: `${service.iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={service.iconClass} style={{ fontSize: '1.5rem', color: service.iconColor }}></i>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>{service.name}</h3>
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.5 }}>{service.description}</p>
                </div>

                {/* Features */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Features</h4>
                  {service.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', color: '#374151', fontSize: '0.875rem' }}>
                      <i className="fas fa-check" style={{ color: '#10B981', fontSize: '0.75rem', marginTop: 2 }}></i> {f}
                    </div>
                  ))}
                </div>

                {/* Pricing Tiers */}
                {(() => {
                  const activeForService = selectedEvent
                    ? eventVAS.find(v => v.serviceType === service.id)
                    : null;
                  const activeTierType = activeForService ? inferTierFromVAS(activeForService) : null;
                  const activeTier = activeTierType
                    ? service.pricing.find(t => t.type === activeTierType)
                    : null;
                  const availableTiers = activeForService
                    ? [] // backend blocks all tiers once one is active
                    : service.pricing;

                  return (
                    <div style={{ borderTop: '2px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
                      {/* Already Active Banner */}
                      {activeForService && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                            <i className="fas fa-check-circle" style={{ color: '#059669', fontSize: '0.8rem' }}></i>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#059669' }}>Active for this event</span>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem', background: '#ECFDF5',
                            borderRadius: 10, border: '2px solid #A7F3D0'
                          }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#065F46', fontSize: '0.9rem' }}>
                                {activeTier ? activeTier.name : 'Active Package'}
                              </div>
                              <div style={{ color: '#059669', fontWeight: 700, fontSize: '1rem' }}>
                                ₹{(activeForService.price || 0).toLocaleString()} paid
                              </div>
                              {activeTier?.coverage && <div style={{ color: '#047857', fontSize: '0.75rem' }}>Coverage: {activeTier.coverage}</div>}
                              {activeTier?.hours && <div style={{ color: '#047857', fontSize: '0.75rem' }}>Duration: {activeTier.hours}</div>}
                              {activeTier?.impressions && <div style={{ color: '#047857', fontSize: '0.75rem' }}>Reach: {activeTier.impressions}</div>}
                            </div>
                            <span style={{
                              padding: '0.4rem 0.875rem', background: '#059669', color: 'white',
                              borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              <i className="fas fa-check"></i> Active
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0.5rem 0 0', textAlign: 'center' }}>
                            <i className="fas fa-info-circle" style={{ marginRight: 4 }}></i>
                            One service per type per event. Select a different event to purchase again.
                          </p>
                        </div>
                      )}

                      {/* Available Tiers */}
                      {availableTiers.length > 0 && (
                        <>
                          {activeForService && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0.75rem 0 0.5rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280' }}>Available Tiers</span>
                            </div>
                          )}
                          {availableTiers.map((tier, idx) => (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.75rem', marginBottom: '0.5rem', background: '#F9FAFB',
                              borderRadius: 10, border: '1px solid #E5E7EB', transition: 'all 0.2s'
                            }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{tier.name}</div>
                                {vasDiscount < 1 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <div style={{ color: '#2563EB', fontWeight: 700, fontSize: '1.125rem' }}>₹{discountedPrice(tier.price).toLocaleString()}</div>
                                    <div style={{ color: '#9CA3AF', fontWeight: 400, fontSize: '0.875rem', textDecoration: 'line-through' }}>₹{tier.price.toLocaleString()}</div>
                                    <span style={{ background: organizerPlan === 'enterprise' ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#fff', borderRadius: 8, padding: '0.1rem 0.4rem', fontSize: '0.68rem', fontWeight: 700 }}>
                                      {organizerPlan === 'enterprise' ? '20% OFF' : '10% OFF'}
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{ color: '#2563EB', fontWeight: 700, fontSize: '1.125rem' }}>₹{tier.price.toLocaleString()}</div>
                                )}
                                {tier.perUnit && <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{tier.perUnit}</div>}
                                {tier.coverage && <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Coverage: {tier.coverage}</div>}
                                {tier.impressions && <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Reach: {tier.impressions}</div>}
                                {tier.hours && <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>Duration: {tier.hours}</div>}
                                {tier.rate && <div style={{ color: '#6B7280', fontSize: '0.75rem' }}>{tier.rate}</div>}
                              </div>
                              <button
                                onClick={() => handlePurchaseClick(service, tier)}
                                disabled={loading}
                                style={{
                                  ...btn('linear-gradient(135deg, #2563EB, #1D4ED8)'),
                                  opacity: loading ? 0.5 : 1,
                                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                                }}
                              >
                                <i className="fa fa-shopping-cart"></i> Purchase
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ ...crd, marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/organizer/subscription')}
              style={{ ...btn('linear-gradient(135deg, #10B981, #059669)'), padding: '0.875rem 2rem', fontSize: '1rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            >
              <i className="fa fa-crown"></i> Manage Subscription
            </button>
          </div>
        </div>

        {/* Payment Processing Modal */}
        {showPaymentModal && selectedService && selectedTier && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 450, width: '90%', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: paymentProgress < 100 ? '#EFF6FF' : '#ECFDF5' }}>
                  <i className={`fas ${paymentProgress < 100 ? 'fa-spinner fa-spin' : 'fa-check-circle'}`} style={{ fontSize: '1.75rem', color: paymentProgress < 100 ? '#2563EB' : '#10B981' }}></i>
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Tier:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{selectedTier.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', paddingTop: '0.75rem', borderTop: '2px solid #E5E7EB' }}>
                  <span style={{ fontWeight: 600, color: '#111827' }}>Amount:</span>
                  <span style={{ fontWeight: 800, color: '#2563EB' }}>₹{discountedPrice(selectedTier.price).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6B7280' }}>Progress</span>
                  <span style={{ fontWeight: 600, color: '#2563EB' }}>{paymentProgress}%</span>
                </div>
                <div style={{ height: 8, background: '#E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #10B981, #059669)', width: `${paymentProgress}%`, transition: 'width 0.3s', borderRadius: 10 }}></div>
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
                <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECFDF5' }}>
                  <i className="fas fa-receipt" style={{ fontSize: '1.75rem', color: '#10B981' }}></i>
                </div>
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
                  <span style={{ fontWeight: 700, color: '#10B981' }}><i className="fas fa-check-circle" style={{ marginRight: 4 }}></i>{receipt.paymentStatus || receipt.status}</span>
                </div>
                <div style={{ height: 1, background: '#E5E7EB', margin: '1rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Service:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.service}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Tier:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.tier}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Event:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.event}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                  <span style={{ color: '#6B7280' }}>Payment Method:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{receipt.paymentMethod}</span>
                </div>
                <div style={{ height: 2, background: '#10B981', margin: '1rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>Total Amount:</span>
                  <span style={{ fontWeight: 800, color: '#10B981' }}>₹{receipt.amount.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={downloadReceipt}
                  style={{
                    flex: 1, padding: '0.875rem', border: '1px solid #10B981', borderRadius: 12,
                    background: 'white', color: '#10B981', fontWeight: 600, fontSize: '0.9375rem',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.5rem'
                  }}>
                  <i className="fa fa-file-pdf"></i> Download PDF
                </button>
                <button onClick={() => { setShowReceiptModal(false); setSuccess(`Successfully purchased ${selectedService.name}!`); setTimeout(() => setSuccess(''), 5000); }}
                  style={{
                    flex: 1, padding: '0.875rem', border: 'none', borderRadius: 12,
                    background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white',
                    fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)', transition: 'all 0.2s'
                  }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Confirmation Modal */}
        {showPurchaseModal && selectedService && selectedTier && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}
            onClick={() => setShowPurchaseModal(false)}>
            <div style={{ background: 'white', borderRadius: 16, padding: '2rem', maxWidth: 500, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}
              onClick={e => e.stopPropagation()}>
              <h2 style={{ textAlign: 'center', color: '#111827', marginBottom: '1.5rem', fontSize: '1.375rem', fontWeight: 700 }}>
                <i className="fas fa-shopping-cart" style={{ marginRight: 8, color: '#2563EB' }}></i>Confirm Purchase
              </h2>
              <div style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: 12, marginBottom: '1.5rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 0.5rem', background: `${selectedService.iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={selectedService.iconClass} style={{ fontSize: '1.5rem', color: selectedService.iconColor }}></i>
                </div>
                <p style={{ textAlign: 'center', color: '#111827', fontWeight: 600, fontSize: '1.125rem', margin: '0 0 0.5rem' }}>{selectedService.name}</p>
                <p style={{ textAlign: 'center', color: '#6B7280', margin: '0 0 0.75rem' }}>{selectedTier.name}</p>
                <div style={{ textAlign: 'center', color: '#2563EB', fontWeight: 700, fontSize: '1.5rem' }}>₹{discountedPrice(selectedTier.price).toLocaleString()}
                  {vasDiscount < 1 && <span style={{ display: 'block', color: '#9CA3AF', fontWeight: 400, fontSize: '0.875rem', textDecoration: 'line-through', marginTop: 2 }}>Original: ₹{selectedTier.price.toLocaleString()}</span>}
                </div>
                <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Event: {myEvents.find(e => e._id === selectedEvent)?.title || 'Selected Event'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleProceedToPayment} disabled={loading}
                  style={{ ...btn('linear-gradient(135deg, #10B981, #059669)'), flex: 1, justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Processing...' : <><i className="fas fa-credit-card" style={{ marginRight: 6 }}></i>Proceed to Payment</>}
                </button>
                <button onClick={() => setShowPurchaseModal(false)} disabled={loading}
                  style={{ flex: 1, padding: '0.875rem', border: '1px solid #D1D5DB', borderRadius: 10, background: 'white', color: '#374151', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
};

export default OrganizerServices;
