/**
 * Event Registration with Payment and Commission Tracking
 * 
 * This module handles event registration payments with automatic commission calculation
 */

const Event = require('../models/event');
const User = require('../models/user');
const { Commission } = require('../models');
const WalletTransaction = require('../models/walletTransaction');

/**
 * Process event registration payment
 * 
 * This function:
 * 1. Validates payment method and amount
 * 2. Gets organizer tier/subscription to determine commission rate
 * 3.Creates commission record
 * 4. Updates event revenue
 * 5. Processes payment (wallet/card/upi)
 * 6. Registers user/team for event
 */
async function processEventRegistrationPayment(req, res) {
  try {
    const { eventId } = req.params;
    const { teamId, paymentMethod, amount } = req.body;
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Get event details
    const event = await Event.getEventById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Verify payment amount matches entry fee
    const entryFee = event.entry_fee || 0;
    if (amount !== entryFee) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment amount. Expected: ₹${entryFee}`
      });
    }
    
    // Get organizer details to determine commission rate
    const organizer = await User.findById(event.createdBy);
    if (!organizer) {
      return res.status(500).json({
        success: false,
        error: 'Organizer not found'
      });
    }
    
    // Determine commission rate based on tier and subscription
    let commissionRate = 15; // Default
    
    if (organizer.subscription && organizer.subscription.plan === 'enterprise') {
      commissionRate = 12;
    } else if (organizer.subscription && organizer.subscription.plan === 'pro') {
      commissionRate = 15;
    } else if (organizer.organizerTier === 'enterprise') {
      commissionRate = 12;
    } else if (organizer.organizerTier === 'premium') {
      commissionRate = 15;
    } else if (organizer.organizerTier === 'established') {
      commissionRate = 17;
    } else {
      commissionRate = 20; // New organizers
    }
    
    // Calculate commission amounts
    const commissionAmount = Math.round((amount * commissionRate) / 100);
    const organizerPayout = amount - commissionAmount;
    
    // Process payment based on method
    let paymentSuccess = false;
    let paymentReference = '';
    
    switch (paymentMethod) {
      case 'wallet':
        // Check wallet balance
        const user = await User.findById(userId);
        if (!user || (user.walletBalance || 0) < amount) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient wallet balance'
          });
        }
        
        // Deduct from wallet
        user.walletBalance = (user.walletBalance || 0) - amount;
        await user.save();
        
        // Create wallet transaction
        const transactionResult = await WalletTransaction.createTransaction({
          userId,
          type: 'debit',
          amount,
          description: `Event registration: ${event.title}`,
          referenceType: 'event_registration',
          referenceId: eventId
        });
        
        paymentReference = transactionResult.transaction?._id || `REG-${Date.now()}`;
        paymentSuccess = true;
        break;
        
      case 'card':
      case 'upi':
      case 'netbanking':
        // In production, integrate with payment gateway (Razorpay/Stripe)
        // For now, simulate successful payment
        paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
        paymentSuccess = true;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid payment method'
        });
    }
    
    if (!paymentSuccess) {
      return res.status(500).json({
        success: false,
        error: 'Payment processing failed'
      });
    }
    
    // Create commission record
    const commissionData = {
      eventId: event._id,
      organizerId: organizer._id,
      userId: userId,
      totalRevenue: amount,
      commissionRate,
      commissionAmount,
      organizerPayout,
      status: 'pending',
      paymentMethod,
      paymentReference
    };
    
    const commissionResult = await Commission.createCommission(commissionData);
    
    if (!commissionResult.success) {
      // Rollback payment if commission creation fails
      console.error('Commission creation failed:', commissionResult.error);
      // In production, implement proper rollback
    }
    
    // Update event revenue
    event.revenue = event.revenue || {
      totalCollected: 0,
      platformCommission: 0,
      organizerPayout: 0,
      refundedAmount: 0
    };
    
    event.revenue.totalCollected += amount;
    event.revenue.platformCommission += commissionAmount;
    event.revenue.organizerPayout += organizerPayout;
    event.registrationCount = (event.registrationCount || 0) + 1;
    
    await event.save();
    
    // Register team/user for event
    if (teamId) {
      const registrationData = {
        team_id: teamId,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentAmount: amount,
        paymentReference,
        registeredAt: new Date()
      };
      
      await Event.registerTeamForEvent(eventId, registrationData);
    }
    
    res.json({
      success: true,
      message: 'Registration successful',
      registration: {
        eventId,
        eventName: event.title,
        amount,
        commissionRate: `${commissionRate}%`,
        paymentReference
      }
    });
    
  } catch (error) {
    console.error('Event registration payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process payment'
    });
  }
}

/**
 * Get commission breakdown for event registration
 */
async function getRegistrationCommissionBreakdown(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Get event
    const event = await Event.getEventById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Get organizer to determine rate
    const organizer = await User.findById(event.createdBy);
    if (!organizer) {
      return res.status(500).json({
        success: false,
        error: 'Organizer not found'
      });
    }
    
    // Determine commission rate
    let commissionRate = 15;
    
    if (organizer.subscription && organizer.subscription.plan === 'enterprise') {
      commissionRate = 12;
    } else if (organizer.subscription && organizer.subscription.plan === 'pro') {
      commissionRate = 15;
    } else if (organizer.organizerTier === 'enterprise') {
      commissionRate = 12;
    } else if (organizer.organizerTier === 'premium') {
      commissionRate = 15;
    } else if (organizer.organizerTier === 'established') {
      commissionRate = 17;
    } else {
      commissionRate = 20;
    }
    
    const entryFee = event.entry_fee || 0;
    const commissionAmount = Math.round((entryFee * commissionRate) / 100);
    const organizerReceives = entryFee - commissionAmount;
    
    res.json({
      success: true,
      breakdown: {
        entryFee,
        commissionRate: `${commissionRate}%`,
        commissionAmount,
        organizerReceives,
        organizerTier: organizer.organizerTier,
        subscriptionPlan: organizer.subscription?.plan || 'free'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  processEventRegistrationPayment,
  getRegistrationCommissionBreakdown
};
