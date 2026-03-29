/**
 * Migration Script: Initialize Tier System for Existing Data
 * 
 * This script:
 * 1. Updates existing organizers with default tier system fields
 * 2. Calculates stats based on existing events
 * 3. Assigns appropriate tiers based on performance
 * 4. Updates event statuses and commission rates
 * 5. Creates default subscription records
 * 
 * Run with: node scripts/migrate-tier-system.js
 */

const mongoose = require('mongoose');
const { User, Event, Subscription } = require('../models');

// Import database connection
require('../config/mongodb');

async function migrateUserTierData() {
  console.log('\n📊 Starting User Tier Migration...\n');

  try {
    // Find all organizers
    const organizers = await User.find({ role: 'organizer' });
    console.log(`Found ${organizers.length} organizers to migrate`);

    for (const organizer of organizers) {
      console.log(`\nProcessing organizer: ${organizer.email}`);

      // Set default verification status if not set
      if (!organizer.verificationStatus) {
        organizer.verificationStatus = 'verified'; // Assume existing organizers are verified
        console.log('  ✓ Set verification status: verified');
      }

      // Initialize organizer stats if not present
      if (!organizer.organizerStats) {
        organizer.organizerStats = {
          totalEvents: 0,
          completedEvents: 0,
          cancelledEvents: 0,
          qualityScore: 0,
          rating: 0,
          totalRevenue: 0,
          totalParticipants: 0
        };
      }

      // Calculate stats from existing events
      const organizerId = organizer._id;

      // Count events by status
      const totalEvents = await Event.countDocuments({ organizerId });
      const completedEvents = await Event.countDocuments({ 
        organizerId, 
        status: 'completed' 
      });
      const cancelledEvents = await Event.countDocuments({ 
        organizerId, 
        status: 'cancelled' 
      });

      // Calculate average rating from completed events
      const eventsWithRatings = await Event.find({
        organizerId,
        averageRating: { $exists: true, $gt: 0 }
      });

      let totalRating = 0;
      let ratingCount = 0;
      eventsWithRatings.forEach(event => {
        if (event.averageRating) {
          totalRating += event.averageRating;
          ratingCount++;
        }
      });
      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      // Update stats
      organizer.organizerStats.totalEvents = totalEvents;
      organizer.organizerStats.completedEvents = completedEvents;
      organizer.organizerStats.cancelledEvents = cancelledEvents;
      organizer.organizerStats.rating = averageRating;

      // Calculate quality score
      const completionRate = totalEvents > 0 ? (completedEvents / totalEvents) : 0;
      const completionScore = completionRate * 40; // Max 40 points
      const ratingScore = (averageRating / 5) * 40; // Max 40 points
      
      let volumeScore = 0;
      if (totalEvents >= 10) volumeScore = 10;
      if (totalEvents >= 20) volumeScore = 15;
      if (totalEvents >= 50) volumeScore = 20;

      const qualityScore = Math.round(completionScore + ratingScore + volumeScore);
      organizer.organizerStats.qualityScore = qualityScore;

      console.log(`  ✓ Stats calculated:`);
      console.log(`    - Total Events: ${totalEvents}`);
      console.log(`    - Completed: ${completedEvents}`);
      console.log(`    - Cancelled: ${cancelledEvents}`);
      console.log(`    - Rating: ${averageRating.toFixed(2)}`);
      console.log(`    - Quality Score: ${qualityScore}`);

      // Determine tier based on stats
      let tier = 'new';
      if (totalEvents >= 50 && averageRating >= 4.5 && qualityScore >= 80) {
        tier = 'enterprise';
      } else if (totalEvents >= 20 && averageRating >= 4.0 && qualityScore >= 60) {
        tier = 'premium';
      } else if (totalEvents >= 5 && averageRating >= 3.5 && qualityScore >= 40) {
        tier = 'established';
      }

      organizer.organizerTier = tier;
      console.log(`  ✓ Tier assigned: ${tier.toUpperCase()}`);

      // Create default free subscription if no subscription exists
      if (!organizer.subscription || !organizer.subscription.plan) {
        organizer.subscription = {
          plan: 'free',
          startDate: new Date(),
          endDate: null,
          status: 'active'
        };
        console.log('  ✓ Default subscription created: FREE');
      }

      // Save updates
      await organizer.save();
      console.log(`  ✅ Organizer updated successfully`);
    }

    console.log(`\n✅ User migration completed: ${organizers.length} organizers updated\n`);

  } catch (error) {
    console.error('❌ Error in user migration:', error);
    throw error;
  }
}

async function migrateEventData() {
  console.log('\n📊 Starting Event Migration...\n');

  try {
    // Find all events without commission data
    const events = await Event.find({
      $or: [
        { commissionRate: { $exists: false } },
        { 'revenue.totalCollected': { $exists: false } },
        { status: 'upcoming' }  // Update old "upcoming" to "approved"
      ]
    });

    console.log(`Found ${events.length} events to migrate`);

    for (const event of events) {
      console.log(`\nProcessing event: ${event.eventName}`);

      // Set default commission rate based on organizer tier
      if (!event.commissionRate) {
        const organizer = await User.findById(event.organizerId);
        
        let commissionRate = 15; // Default
        if (organizer) {
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
        }

        event.commissionRate = commissionRate;
        console.log(`  ✓ Commission rate set: ${commissionRate}%`);
      }

      // Initialize revenue tracking if not present
      if (!event.revenue) {
        event.revenue = {
          totalCollected: 0,
          platformCommission: 0,
          organizerPayout: 0,
          refundedAmount: 0
        };
        console.log('  ✓ Revenue tracking initialized');
      }

      // Update status from "upcoming" to "approved"
      if (event.status === 'upcoming') {
        event.status = 'approved';
        console.log('  ✓ Status updated: upcoming → approved');
      }

      // Set visibility if not set
      if (!event.visibility) {
        event.visibility = 'public';
        console.log('  ✓ Visibility set: public');
      }

      // Initialize ratings array if not present
      if (!event.ratings || !Array.isArray(event.ratings)) {
        event.ratings = [];
        event.averageRating = 0;
        console.log('  ✓ Ratings initialized');
      }

      // Set registration count if not present
      if (event.registrationCount === undefined) {
        event.registrationCount = 0;
        console.log('  ✓ Registration count initialized');
      }

      await event.save();
      console.log(`  ✅ Event updated successfully`);
    }

    console.log(`\n✅ Event migration completed: ${events.length} events updated\n`);

  } catch (error) {
    console.error('❌ Error in event migration:', error);
    throw error;
  }
}

async function createDefaultSubscriptions() {
  console.log('\n📊 Creating Default Subscriptions...\n');

  try {
    // Find organizers without subscription records in Subscription collection
    const organizers = await User.find({ 
      role: 'organizer',
      verificationStatus: 'verified'
    });

    let created = 0;

    for (const organizer of organizers) {
      // Check if subscription document already exists
      const existingSub = await Subscription.findOne({ userId: organizer._id });
      
      if (!existingSub) {
        const subscription = new Subscription({
          userId: organizer._id,
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: null,
          autoRenew: false,
          usage: {
            eventsCreated: organizer.organizerStats?.totalEvents || 0,
            eventsLimit: 3,
            featuredListingsUsed: 0,
            featuredListingsLimit: 0,
            resetDate: new Date()
          }
        });

        await subscription.save();
        created++;
        console.log(`  ✓ Created free subscription for: ${organizer.email}`);
      }
    }

    console.log(`\n✅ Subscription creation completed: ${created} new subscriptions\n`);

  } catch (error) {
    console.error('❌ Error creating subscriptions:', error);
    throw error;
  }
}

async function generateMigrationReport() {
  console.log('\n📊 MIGRATION REPORT\n');
  console.log('='.repeat(60));

  // Organizer stats
  const totalOrganizers = await User.countDocuments({ role: 'organizer' });
  const verifiedOrganizers = await User.countDocuments({ 
    role: 'organizer', 
    verificationStatus: 'verified' 
  });
  const pendingOrganizers = await User.countDocuments({ 
    role: 'organizer', 
    verificationStatus: 'pending' 
  });

  console.log('\n👥 ORGANIZERS');
  console.log(`  Total: ${totalOrganizers}`);
  console.log(`  Verified: ${verifiedOrganizers}`);
  console.log(`  Pending: ${pendingOrganizers}`);

  // Tier distribution
  const newTier = await User.countDocuments({ organizerTier: 'new' });
  const establishedTier = await User.countDocuments({ organizerTier: 'established' });
  const premiumTier = await User.countDocuments({ organizerTier: 'premium' });
  const enterpriseTier = await User.countDocuments({ organizerTier: 'enterprise' });

  console.log('\n🏆 TIER DISTRIBUTION');
  console.log(`  New: ${newTier}`);
  console.log(`  Established: ${establishedTier}`);
  console.log(`  Premium: ${premiumTier}`);
  console.log(`  Enterprise: ${enterpriseTier}`);

  // Event stats
  const totalEvents = await Event.countDocuments();
  const approvedEvents = await Event.countDocuments({ status: 'approved' });
  const completedEvents = await Event.countDocuments({ status: 'completed' });
  const pendingEvents = await Event.countDocuments({ status: 'pending_approval' });

  console.log('\n📅 EVENTS');
  console.log(`  Total: ${totalEvents}`);
  console.log(`  Approved: ${approvedEvents}`);
  console.log(`  Completed: ${completedEvents}`);
  console.log(`  Pending Approval: ${pendingEvents}`);

  // Subscription stats
  const totalSubs = await Subscription.countDocuments();
  const freeSubs = await Subscription.countDocuments({ plan: 'free' });
  const proSubs = await Subscription.countDocuments({ plan: 'pro' });
  const enterpriseSubs = await Subscription.countDocuments({ plan: 'enterprise' });

  console.log('\n💳 SUBSCRIPTIONS');
  console.log(`  Total: ${totalSubs}`);
  console.log(`  Free: ${freeSubs}`);
  console.log(`  Pro: ${proSubs}`);
  console.log(`  Enterprise: ${enterpriseSubs}`);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Migration completed successfully!\n');
}

// Main migration function
async function runMigration() {
  console.log('\n🚀 TIER SYSTEM MIGRATION STARTED\n');
  console.log('This will update existing data to support the new tier system.');
  console.log('No data will be deleted, only new fields will be added.\n');

  try {
    // Step 1: Migrate user data
    await migrateUserTierData();

    // Step 2: Migrate event data
    await migrateEventData();

    // Step 3: Create default subscriptions
    await createDefaultSubscriptions();

    // Step 4: Generate report
    await generateMigrationReport();

    console.log('🎉 All migrations completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { 
  migrateUserTierData, 
  migrateEventData, 
  createDefaultSubscriptions,
  generateMigrationReport 
};
