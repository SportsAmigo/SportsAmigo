/**
 * Script to run the migration from SQLite to MongoDB
 * and validate the results.
 * 
 * Run with: node scripts/run-migration.js
 */

const { execSync } = require('child_process');
const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

// Import models
const User = require('../models/schemas/userSchema');
const Team = require('../models/schemas/teamSchema');
const Event = require('../models/schemas/eventSchema');

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Run the migration script
    console.log('Running migration script...');
    execSync('node scripts/migrate-to-mongodb.js', { stdio: 'inherit' });
    
    // Validate the results
    console.log('\nValidating migration results...');
    
    // Check user data
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in MongoDB`);
    
    // Check team data
    const teamCount = await Team.countDocuments();
    console.log(`Found ${teamCount} teams in MongoDB`);
    
    // Check event data
    const eventCount = await Event.countDocuments();
    console.log(`Found ${eventCount} events in MongoDB`);
    
    // Sample output of one record from each collection
    if (userCount > 0) {
      const sampleUser = await User.findOne();
      console.log('\nSample User:');
      console.log({
        _id: sampleUser._id,
        email: sampleUser.email,
        role: sampleUser.role,
        name: `${sampleUser.first_name} ${sampleUser.last_name}`
      });
    }
    
    if (teamCount > 0) {
      const sampleTeam = await Team.findOne();
      console.log('\nSample Team:');
      console.log({
        _id: sampleTeam._id,
        name: sampleTeam.name,
        sport_type: sampleTeam.sport_type,
        manager_id: sampleTeam.manager_id,
        members: sampleTeam.members.length
      });
    }
    
    if (eventCount > 0) {
      const sampleEvent = await Event.findOne();
      console.log('\nSample Event:');
      console.log({
        _id: sampleEvent._id,
        title: sampleEvent.title,
        sport_type: sampleEvent.sport_type,
        event_date: sampleEvent.event_date,
        registrations: sampleEvent.team_registrations.length
      });
    }
    
    console.log('\nMigration completed and validated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration or validation:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 