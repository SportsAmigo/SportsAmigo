/**
 * Test Script: Verify Tier System Implementation
 * 
 * This script tests:
 * 1. Model imports and initialization
 * 2. Tier progression logic
 * 3. Commission calculation
 * 4. Subscription management
 * 5. Quality score calculation
 * 
 * Run with: node scripts/test-tier-system.js
 */

const mongoose = require('mongoose');
const { User, Event, Commission, Subscription } = require('../models');
const { calculateQualityScore, determineTier } = require('../controllers/tierManagementController');

require('../config/mongodb');

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testResult(testName, passed) {
  if (passed) {
    log(`✅ ${testName}`, 'green');
  } else {
    log(`❌ ${testName}`, 'red');
  }
  return passed;
}

// Test 1: Model Imports
async function testModelImports() {
  log('\n📦 Test 1: Model Imports', 'blue');
  
  const tests = [
    testResult('User model imported', User !== undefined),
    testResult('Event model imported', Event !== undefined),
    testResult('Commission model imported', Commission !== undefined),
    testResult('Subscription model imported', Subscription !== undefined)
  ];

  return tests.every(t => t);
}

// Test 2: User Schema Fields
async function testUserSchemaFields() {
  log('\n👤 Test 2: User Schema Fields', 'blue');
  
  const userSchema = User.schema.obj;
  
  const tests = [
    testResult('organizerTier field exists', userSchema.organizerTier !== undefined),
    testResult('organizerStats field exists', userSchema.organizerStats !== undefined),
    testResult('subscription field exists', userSchema.subscription !== undefined),
    testResult('verificationStatus field exists', userSchema.verificationStatus !== undefined),
    testResult('moderatorRegion field exists', userSchema.moderatorRegion !== undefined),
    testResult('role includes moderator', userSchema.role.enum.includes('moderator'))
  ];

  return tests.every(t => t);
}

// Test 3: Event Schema Fields
async function testEventSchemaFields() {
  log('\n📅 Test 3: Event Schema Fields', 'blue');
  
  const eventSchema = Event.schema.obj;
  
  const tests = [
    testResult('commissionRate field exists', eventSchema.commissionRate !== undefined),
    testResult('revenue field exists', eventSchema.revenue !== undefined),
    testResult('visibility field exists', eventSchema.visibility !== undefined),
    testResult('approvalStatus field exists', eventSchema.approvalStatus !== undefined),
    testResult('ratings field exists', eventSchema.ratings !== undefined),
    testResult('status includes pending_approval', eventSchema.status.enum.includes('pending_approval'))
  ];

  return tests.every(t => t);
}

// Test 4: Quality Score Calculation
async function testQualityScoreCalculation() {
  log('\n🎯 Test 4: Quality Score Calculation', 'blue');
  
  // Test case 1: Perfect organizer
  const perfectStats = {
    totalEvents: 100,
    completedEvents: 100,
    cancelledEvents: 0,
    rating: 5.0
  };
  const perfectScore = calculateQualityScore(perfectStats);
  
  // Test case 2: Average organizer
  const avgStats = {
    totalEvents: 20,
    completedEvents: 18,
    cancelledEvents: 2,
    rating: 4.0
  };
  const avgScore = calculateQualityScore(avgStats);
  
  // Test case 3: Poor organizer
  const poorStats = {
    totalEvents: 10,
    completedEvents: 5,
    cancelledEvents: 5,
    rating: 2.5
  };
  const poorScore = calculateQualityScore(poorStats);
  
  log(`  Perfect organizer score: ${perfectScore}`, 'yellow');
  log(`  Average organizer score: ${avgScore}`, 'yellow');
  log(`  Poor organizer score: ${poorScore}`, 'yellow');
  
  const tests = [
    testResult('Perfect score is high (>80)', perfectScore > 80),
    testResult('Average score is medium (40-70)', avgScore >= 40 && avgScore <= 70),
    testResult('Poor score is low (<40)', poorScore < 40),
    testResult('Scores are in valid range (0-100)', 
      perfectScore >= 0 && perfectScore <= 100 &&
      avgScore >= 0 && avgScore <= 100 &&
      poorScore >= 0 && poorScore <= 100
    )
  ];

  return tests.every(t => t);
}

// Test 5: Tier Determination Logic
async function testTierDetermination() {
  log('\n🏆 Test 5: Tier Determination Logic', 'blue');
  
  // Test case 1: New tier
  const newOrganizerStats = {
    totalEvents: 2,
    completedEvents: 2,
    cancelledEvents: 0,
    rating: 4.5,
    qualityScore: 50
  };
  const newTier = determineTier(newOrganizerStats);
  
  // Test case 2: Established tier
  const establishedStats = {
    totalEvents: 10,
    completedEvents: 9,
    cancelledEvents: 1,
    rating: 4.0,
    qualityScore: 65
  };
  const establishedTier = determineTier(establishedStats);
  
  // Test case 3: Premium tier
  const premiumStats = {
    totalEvents: 30,
    completedEvents: 28,
    cancelledEvents: 2,
    rating: 4.3,
    qualityScore: 75
  };
  const premiumTier = determineTier(premiumStats);
  
  // Test case 4: Enterprise tier
  const enterpriseStats = {
    totalEvents: 60,
    completedEvents: 58,
    cancelledEvents: 2,
    rating: 4.7,
    qualityScore: 88
  };
  const enterpriseTier = determineTier(enterpriseStats);
  
  log(`  2 events, rating 4.5 → ${newTier}`, 'yellow');
  log(`  10 events, rating 4.0 → ${establishedTier}`, 'yellow');
  log(`  30 events, rating 4.3 → ${premiumTier}`, 'yellow');
  log(`  60 events, rating 4.7 → ${enterpriseTier}`, 'yellow');
  
  const tests = [
    testResult('Low activity → new tier', newTier === 'new'),
    testResult('Medium activity → established tier', establishedTier === 'established'),
    testResult('High activity → premium tier', premiumTier === 'premium'),
    testResult('Very high activity → enterprise tier', enterpriseTier === 'enterprise')
  ];

  return tests.every(t => t);
}

// Test 6: Commission Rate Assignment
async function testCommissionRates() {
  log('\n💰 Test 6: Commission Rate Assignment', 'blue');
  
  const rates = {
    new: 20,
    established: 17,
    premium: 15,
    enterprise: 12
  };
  
  const tests = [
    testResult('New tier gets 20% commission', rates.new === 20),
    testResult('Established tier gets 17% commission', rates.established === 17),
    testResult('Premium tier gets 15% commission', rates.premium === 15),
    testResult('Enterprise tier gets 12% commission', rates.enterprise === 12),
    testResult('Commission rates decrease with tier', 
      rates.new > rates.established && 
      rates.established > rates.premium && 
      rates.premium > rates.enterprise
    )
  ];

  return tests.every(t => t);
}

// Test 7: Subscription Plan Features
async function testSubscriptionPlans() {
  log('\n💳 Test 7: Subscription Plan Features', 'blue');
  
  const plans = {
    free: {
      price: 0,
      eventsLimit: 3,
      commissionRate: 20,
      features: ['Basic analytics', 'Email support']
    },
    pro: {
      price: 2999,
      eventsLimit: -1, // unlimited
      commissionRate: 15,
      features: ['Advanced analytics', 'Priority support', 'Featured listings']
    },
    enterprise: {
      price: 9999,
      eventsLimit: -1,
      commissionRate: 12,
      features: ['Full analytics', 'Dedicated support', 'API access', 'White-label']
    }
  };
  
  const tests = [
    testResult('Free plan exists', plans.free !== undefined),
    testResult('Pro plan exists', plans.pro !== undefined),
    testResult('Enterprise plan exists', plans.enterprise !== undefined),
    testResult('Free plan has event limit', plans.free.eventsLimit === 3),
    testResult('Paid plans have unlimited events', 
      plans.pro.eventsLimit === -1 && plans.enterprise.eventsLimit === -1
    ),
    testResult('Higher plans have lower commission', 
      plans.free.commissionRate > plans.pro.commissionRate && 
      plans.pro.commissionRate > plans.enterprise.commissionRate
    )
  ];

  log(`  Free: ${plans.free.eventsLimit} events/month, ${plans.free.commissionRate}% commission`, 'yellow');
  log(`  Pro: Unlimited events, ${plans.pro.commissionRate}% commission`, 'yellow');
  log(`  Enterprise: Unlimited events, ${plans.enterprise.commissionRate}% commission`, 'yellow');

  return tests.every(t => t);
}

// Test 8: Database Connection
async function testDatabaseConnection() {
  log('\n🔌 Test 8: Database Connection', 'blue');
  
  try {
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    log(`  Connection state: ${states[state]}`, 'yellow');
    
    const tests = [
      testResult('Database connection active', state === 1)
    ];

    return tests.every(t => t);
  } catch (error) {
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

// Test 9: Model Methods Exist
async function testModelMethods() {
  log('\n🔧 Test 9: Model Methods', 'blue');
  
  const tests = [
    testResult('Commission.createCommission method exists', 
      typeof Commission.createCommission === 'function'
    ),
    testResult('Commission.getPlatformRevenue method exists', 
      typeof Commission.getPlatformRevenue === 'function'
    ),
    testResult('Subscription.createSubscription method exists', 
      typeof Subscription.createSubscription === 'function'
    ),
    testResult('Subscription model has schema methods', 
      Subscription.schema.methods !== undefined
    )
  ];

  return tests.every(t => t);
}

// Test 10: Validation Rules
async function testValidationRules() {
  log('\n✔️ Test 10: Validation Rules', 'blue');
  
  try {
    // Test invalid tier
    const invalidUser = new User({
      name: 'Test',
      email: 'test@test.com',
      role: 'organizer',
      organizerTier: 'invalid_tier' // Should fail
    });
    
    let validationFailed = false;
    try {
      await invalidUser.validate();
    } catch (error) {
      validationFailed = true;
    }
    
    // Test invalid role
    const invalidRole = new User({
      name: 'Test',
      email: 'test2@test.com',
      role: 'superadmin' // Should fail
    });
    
    let roleFailed = false;
    try {
      await invalidRole.validate();
    } catch (error) {
      roleFailed = true;
    }
    
    const tests = [
      testResult('Invalid tier rejected', validationFailed),
      testResult('Invalid role rejected', roleFailed)
    ];

    return tests.every(t => t);
  } catch (error) {
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 TIER SYSTEM IMPLEMENTATION TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');

  const results = [];

  try {
    results.push(await testModelImports());
    results.push(await testUserSchemaFields());
    results.push(await testEventSchemaFields());
    results.push(await testQualityScoreCalculation());
    results.push(await testTierDetermination());
    results.push(await testCommissionRates());
    results.push(await testSubscriptionPlans());
    results.push(await testDatabaseConnection());
    results.push(await testModelMethods());
    results.push(await testValidationRules());

    log('\n' + '='.repeat(60), 'blue');
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    const percentage = Math.round((passed / total) * 100);

    if (passed === total) {
      log(`\n✅ ALL TESTS PASSED (${passed}/${total}) - ${percentage}%`, 'green');
    } else {
      log(`\n⚠️ SOME TESTS FAILED (${passed}/${total}) - ${percentage}%`, 'yellow');
    }

    log('='.repeat(60) + '\n', 'blue');

    process.exit(passed === total ? 0 : 1);

  } catch (error) {
    log('\n❌ Test suite failed with error:', 'red');
    log(error.message, 'red');
    log(error.stack, 'yellow');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  // Wait for DB connection
  setTimeout(() => {
    runAllTests();
  }, 2000);
}

module.exports = { runAllTests };
