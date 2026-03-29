const { User, Event } = require('../models');

/**
 * Tier Management Controller
 * Handles automatic organizer tier progression and management
 */

/**
 * Calculate organizer quality score
 * Based on: event completion rate, ratings, refund rate, response time
 */
async function calculateQualityScore(organizerId) {
  try {
    const organizer = await User.findById(organizerId);
    if (!organizer) return 0;

    const events = await Event.find({ organizer_id: organizerId });
    
    if (events.length === 0) return 0;

    let score = 0;
    
    // Event completion rate (40 points max)
    const totalEvents = organizer.organizerStats.totalEvents || 0;
    const completedEvents = organizer.organizerStats.completedEvents || 0;
    const cancelledEvents = organizer.organizerStats.cancelledEvents || 0;
    
    if (totalEvents > 0) {
      const completionRate = completedEvents / totalEvents;
      const cancellationRate = cancelledEvents / totalEvents;
      score += completionRate * 40;
      score -= cancellationRate * 20; // Penalty for cancellations
    }

    // Average rating (40 points max)
    const avgRating = organizer.organizerStats.rating || 0;
    score += (avgRating / 5) * 40;

    // Number of successful events (20 points max)
    const eventBonus = Math.min(completedEvents / 50, 1) * 20; // Max at 50 events
    score += eventBonus;

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return Math.round(score);
  } catch (error) {
    console.error('Error calculating quality score:', error);
    return 0;
  }
}

/**
 * Determine appropriate tier based on stats
 */
function determineTier(organizerStats, qualityScore) {
  const { completedEvents, rating } = organizerStats;

  // Enterprise tier: 50+ events, 4.5+ rating, 80+ quality score
  if (completedEvents >= 50 && rating >= 4.5 && qualityScore >= 80) {
    return 'enterprise';
  }

  // Premium tier: 20+ events, 4.0+ rating, 60+ quality score
  if (completedEvents >= 20 && rating >= 4.0 && qualityScore >= 60) {
    return 'premium';
  }

  // Established tier: 5+ events, 3.5+ rating, 40+ quality score
  if (completedEvents >= 5 && rating >= 3.5 && qualityScore >= 40) {
    return 'established';
  }

  // New tier: Default
  return 'new';
}

/**
 * Update organizer tier automatically
 */
exports.updateOrganizerTier = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Calculate quality score
    const qualityScore = await calculateQualityScore(organizerId);

    // Determine new tier
    const newTier = determineTier(organizer.organizerStats, qualityScore);

    // Update organizer
    organizer.organizerTier = newTier;
    organizer.organizerStats.qualityScore = qualityScore;
    await organizer.save();

    res.json({
      success: true,
      message: 'Organizer tier updated',
      data: {
        organizerId,
        oldTier: organizer.organizerTier,
        newTier,
        qualityScore,
        stats: organizer.organizerStats
      }
    });
  } catch (error) {
    console.error('Error updating organizer tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organizer tier',
      error: error.message
    });
  }
};

/**
 * Batch update all organizer tiers (cron job or admin trigger)
 */
exports.batchUpdateTiers = async (req, res) => {
  try {
    // Only admin can trigger batch update
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can trigger batch updates'
      });
    }

    const organizers = await User.find({ role: 'organizer' });

    const results = [];

    for (const organizer of organizers) {
      try {
        const qualityScore = await calculateQualityScore(organizer._id);
        const oldTier = organizer.organizerTier;
        const newTier = determineTier(organizer.organizerStats, qualityScore);

        if (oldTier !== newTier || organizer.organizerStats.qualityScore !== qualityScore) {
          organizer.organizerTier = newTier;
          organizer.organizerStats.qualityScore = qualityScore;
          await organizer.save();

          results.push({
            organizerId: organizer._id,
            email: organizer.email,
            oldTier,
            newTier,
            qualityScore,
            changed: oldTier !== newTier
          });
        }
      } catch (error) {
        console.error(`Error updating organizer ${organizer._id}:`, error);
        results.push({
          organizerId: organizer._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Batch tier update completed',
      data: {
        totalProcessed: organizers.length,
        results
      }
    });
  } catch (error) {
    console.error('Error in batch tier update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform batch update',
      error: error.message
    });
  }
};

/**
 * Update organizer stats when event is completed
 */
exports.updateStatsOnEventComplete = async (organizerId, eventId) => {
  try {
    const organizer = await User.findById(organizerId);
    const event = await Event.findById(eventId);

    if (!organizer || !event) return;

    // Update stats
    organizer.organizerStats.completedEvents += 1;
    
    // Update total revenue
    if (event.revenue && event.revenue.totalCollected) {
      organizer.organizerStats.totalRevenue += event.revenue.totalCollected;
    }

    // Update participant count
    if (event.registrationCount) {
      organizer.organizerStats.totalParticipants += event.registrationCount;
    }

    // Calculate average rating from all events
    const events = await Event.find({ organizer_id: organizerId });
    const ratedEvents = events.filter(e => e.averageRating > 0);
    if (ratedEvents.length > 0) {
      const totalRating = ratedEvents.reduce((sum, e) => sum + e.averageRating, 0);
      organizer.organizerStats.rating = totalRating / ratedEvents.length;
    }

    // Recalculate quality score
    const qualityScore = await calculateQualityScore(organizerId);
    organizer.organizerStats.qualityScore = qualityScore;

    // Determine and update tier
    const newTier = determineTier(organizer.organizerStats, qualityScore);
    organizer.organizerTier = newTier;

    await organizer.save();

    return organizer;
  } catch (error) {
    console.error('Error updating stats on event complete:', error);
    throw error;
  }
};

/**
 * Update organizer stats when event is cancelled
 */
exports.updateStatsOnEventCancel = async (organizerId) => {
  try {
    const organizer = await User.findById(organizerId);
    if (!organizer) return;

    organizer.organizerStats.cancelledEvents += 1;

    // Recalculate quality score (cancellations reduce score)
    const qualityScore = await calculateQualityScore(organizerId);
    organizer.organizerStats.qualityScore = qualityScore;

    // May result in tier downgrade
    const newTier = determineTier(organizer.organizerStats, qualityScore);
    organizer.organizerTier = newTier;

    await organizer.save();

    return organizer;
  } catch (error) {
    console.error('Error updating stats on event cancel:', error);
    throw error;
  }
};

/**
 * Get tier upgrade progress for an organizer
 */
exports.getTierProgress = async (req, res) => {
  try {
    const organizerId = req.params.organizerId || req.user._id;

    const organizer = await User.findById(organizerId);
    if (!organizer || organizer.role !== 'organizer') {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    const currentTier = organizer.organizerTier;
    const stats = organizer.organizerStats;
    const qualityScore = stats.qualityScore || 0;

    let nextTier, requirements, progress;

    switch (currentTier) {
      case 'new':
        nextTier = 'established';
        requirements = {
          completedEvents: 5,
          rating: 3.5,
          qualityScore: 40
        };
        progress = {
          completedEvents: {
            current: stats.completedEvents,
            required: 5,
            percentage: Math.min((stats.completedEvents / 5) * 100, 100)
          },
          rating: {
            current: stats.rating,
            required: 3.5,
            percentage: Math.min((stats.rating / 3.5) * 100, 100)
          },
          qualityScore: {
            current: qualityScore,
            required: 40,
            percentage: Math.min((qualityScore / 40) * 100, 100)
          }
        };
        break;

      case 'established':
        nextTier = 'premium';
        requirements = {
          completedEvents: 20,
          rating: 4.0,
          qualityScore: 60
        };
        progress = {
          completedEvents: {
            current: stats.completedEvents,
            required: 20,
            percentage: Math.min((stats.completedEvents / 20) * 100, 100)
          },
          rating: {
            current: stats.rating,
            required: 4.0,
            percentage: Math.min((stats.rating / 4.0) * 100, 100)
          },
          qualityScore: {
            current: qualityScore,
            required: 60,
            percentage: Math.min((qualityScore / 60) * 100, 100)
          }
        };
        break;

      case 'premium':
        nextTier = 'enterprise';
        requirements = {
          completedEvents: 50,
          rating: 4.5,
          qualityScore: 80
        };
        progress = {
          completedEvents: {
            current: stats.completedEvents,
            required: 50,
            percentage: Math.min((stats.completedEvents / 50) * 100, 100)
          },
          rating: {
            current: stats.rating,
            required: 4.5,
            percentage: Math.min((stats.rating / 4.5) * 100, 100)
          },
          qualityScore: {
            current: qualityScore,
            required: 80,
            percentage: Math.min((qualityScore / 80) * 100, 100)
          }
        };
        break;

      case 'enterprise':
        nextTier = null;
        requirements = null;
        progress = null;
        break;
    }

    res.json({
      success: true,
      data: {
        currentTier,
        nextTier,
        requirements,
        progress,
        stats
      }
    });
  } catch (error) {
    console.error('Error getting tier progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tier progress',
      error: error.message
    });
  }
};

/**
 * Get tier benefits
 */
exports.getTierBenefits = async (req, res) => {
  try {
    const benefits = {
      new: {
        name: 'New Organizer',
        maxSimultaneousEvents: 3,
        eventApproval: 'Required for each event',
        commissionRate: 20,
        visibility: 'Standard',
        support: 'Email support',
        analytics: 'Basic',
        features: [
          'Create up to 3 events simultaneously',
          'Events require moderator approval',
          '20% platform commission',
          'Standard event listing',
          'Email support'
        ]
      },
      established: {
        name: 'Established Organizer',
        maxSimultaneousEvents: 10,
        eventApproval: 'Auto-approved for standard events',
        commissionRate: 17,
        visibility: 'Higher priority in listings',
        support: 'Priority email support',
        analytics: 'Advanced',
        features: [
          'Create up to 10 events simultaneously',
          'Auto-approval for standard events',
          '17% platform commission (reduced)',
          'Higher visibility in event listings',
          'Advanced analytics dashboard',
          'Priority email support',
          'Event performance insights'
        ]
      },
      premium: {
        name: 'Premium Organizer',
        maxSimultaneousEvents: -1, // Unlimited
        eventApproval: 'Auto-approved (instant publishing)',
        commissionRate: 15,
        visibility: 'Premium listing placement',
        support: 'Priority support with faster response',
        analytics: 'Comprehensive analytics',
        features: [
          'Unlimited events',
          'Instant event publishing',
          '15% platform commission',
          'Premium listing placement',
          'Comprehensive analytics and insights',
          'Priority support',
          'Custom branding options',
          'Early access to new features',
          'Performance benchmarking'
        ]
      },
      enterprise: {
        name: 'Enterprise Organizer',
        maxSimultaneousEvents: -1, // Unlimited
        eventApproval: 'Auto-approved with full autonomy',
        commissionRate: 12,
        visibility: 'Featured placement + sponsored options',
        support: 'Dedicated account manager',
        analytics: 'Advanced analytics + API access',
        features: [
          'Unlimited events',
          'Full autonomy (instant publishing)',
          '12% platform commission (lowest rate)',
          'Featured event placement',
          'Sponsored listing options',
          'Dedicated account manager',
          'API access for integration',
          'White-label options',
          'Advanced analytics and custom reports',
          'Multi-user accounts',
          'Advanced marketing tools',
          'Priority in search results'
        ]
      }
    };

    res.json({
      success: true,
      data: benefits
    });
  } catch (error) {
    console.error('Error getting tier benefits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tier benefits',
      error: error.message
    });
  }
};

// Export the helper function for use in other controllers
module.exports.calculateQualityScore = calculateQualityScore;
