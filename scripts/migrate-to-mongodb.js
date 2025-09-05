/**
 * Migration script to transfer data from SQLite to MongoDB
 * 
 * Run with: node scripts/migrate-to-mongodb.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

// SQLite database paths
const mainDbPath = path.join(__dirname, '../database/sportsamigo.db');
const teamsDbPath = path.join(__dirname, '../database/teams.db');
const eventsDbPath = path.join(__dirname, '../database/sports-events.db');

// Import Mongoose models
const User = require('../models/schemas/userSchema');
const Team = require('../models/schemas/teamSchema');
const Event = require('../models/schemas/eventSchema');

// Connect to SQLite databases
const mainDb = new sqlite3.Database(mainDbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error connecting to main SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to main SQLite database');
});

const teamsDb = new sqlite3.Database(teamsDbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error connecting to teams SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to teams SQLite database');
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  startMigration();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Main migration function
async function startMigration() {
  try {
    console.log('Starting migration from SQLite to MongoDB...');
    
    // Clear existing MongoDB collections
    await clearCollections();
    
    // Migrate users and profiles
    const users = await migrateUsers();
    
    // Map old SQLite IDs to new MongoDB ObjectIds
    const userIdMap = users.reduce((map, user) => {
      map[user.sqliteId] = user._id;
      return map;
    }, {});
    
    // Migrate teams
    const teams = await migrateTeams(userIdMap);
    
    // Map team IDs
    const teamIdMap = teams.reduce((map, team) => {
      map[team.sqliteId] = team._id;
      return map;
    }, {});
    
    // Migrate events
    await migrateEvents(userIdMap, teamIdMap);
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Clear existing collections
async function clearCollections() {
  console.log('Clearing existing MongoDB collections...');
  await User.deleteMany({});
  await Team.deleteMany({});
  await Event.deleteMany({});
  console.log('Collections cleared');
}

// Migrate users and their profiles
function migrateUsers() {
  return new Promise((resolve, reject) => {
    console.log('Migrating users and profiles...');
    
    const sql = `
      SELECT u.*, p.age, p.address, p.join_date, p.preferred_sports, 
             p.organization_name, p.team_name
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
    `;
    
    mainDb.all(sql, [], async (err, rows) => {
      if (err) {
        console.error('Error fetching users from SQLite:', err);
        return reject(err);
      }
      
      console.log(`Found ${rows.length} users to migrate`);
      
      const migratedUsers = [];
      
      for (const row of rows) {
        try {
          const user = new User({
            email: row.email,
            password: row.password, // Already hashed in SQLite
            role: row.role,
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            phone: row.phone || '',
            bio: row.bio || '',
            profile_image: row.profile_image || '',
            created_at: row.created_at ? new Date(row.created_at) : new Date(),
            profile: {
              age: row.age || null,
              address: row.address || '',
              join_date: row.join_date ? new Date(row.join_date) : new Date(),
              preferred_sports: row.preferred_sports || '',
              organization_name: row.organization_name || '',
              team_name: row.team_name || ''
            }
          });
          
          // Save to MongoDB
          await user.save();
          
          // Store mapping between SQLite ID and MongoDB ID
          user.sqliteId = row.id;
          migratedUsers.push(user);
          
          console.log(`Migrated user: ${row.email}`);
        } catch (error) {
          console.error(`Error migrating user ${row.email}:`, error);
        }
      }
      
      console.log(`Successfully migrated ${migratedUsers.length} users`);
      resolve(migratedUsers);
    });
  });
}

// Migrate teams
function migrateTeams(userIdMap) {
  return new Promise((resolve, reject) => {
    console.log('Migrating teams...');
    
    const sql = `SELECT * FROM teams`;
    
    teamsDb.all(sql, [], async (err, rows) => {
      if (err) {
        console.error('Error fetching teams from SQLite:', err);
        return reject(err);
      }
      
      console.log(`Found ${rows.length} teams to migrate`);
      
      const migratedTeams = [];
      
      for (const row of rows) {
        try {
          // Map the SQLite manager_id to MongoDB ObjectId
          const managerId = userIdMap[row.manager_id];
          
          if (!managerId) {
            console.warn(`Manager ID ${row.manager_id} not found in user mapping, skipping team ${row.name}`);
            continue;
          }
          
          const team = new Team({
            name: row.name,
            sport_type: row.sport_type,
            manager_id: managerId,
            description: row.description || '',
            max_members: row.max_members || 0,
            created_at: row.created_at ? new Date(row.created_at) : new Date(),
            members: [], // Will be populated later
            join_requests: [] // Will be populated later
          });
          
          // Save to MongoDB
          await team.save();
          
          // Store mapping between SQLite ID and MongoDB ID
          team.sqliteId = row.id;
          migratedTeams.push(team);
          
          console.log(`Migrated team: ${row.name}`);
        } catch (error) {
          console.error(`Error migrating team ${row.name}:`, error);
        }
      }
      
      // Now migrate team members
      await migrateTeamMembers(migratedTeams, userIdMap);
      
      // Migrate team join requests
      await migrateTeamJoinRequests(migratedTeams, userIdMap);
      
      console.log(`Successfully migrated ${migratedTeams.length} teams`);
      resolve(migratedTeams);
    });
  });
}

// Migrate team members
async function migrateTeamMembers(teams, userIdMap) {
  return new Promise((resolve, reject) => {
    console.log('Migrating team members...');
    
    const sql = `SELECT * FROM team_members`;
    
    teamsDb.all(sql, [], async (err, rows) => {
      if (err) {
        console.error('Error fetching team members from SQLite:', err);
        return reject(err);
      }
      
      console.log(`Found ${rows.length} team members to migrate`);
      
      for (const row of rows) {
        try {
          // Find the corresponding team and player
          const team = teams.find(t => t.sqliteId === row.team_id);
          const playerId = userIdMap[row.player_id];
          
          if (!team || !playerId) {
            console.warn(`Team ID ${row.team_id} or Player ID ${row.player_id} not found, skipping member`);
            continue;
          }
          
          // Add member to team
          team.members.push({
            player_id: playerId,
            joined_date: row.joined_date ? new Date(row.joined_date) : new Date(),
            status: row.status || 'active'
          });
          
          // Save team
          await team.save();
          console.log(`Added member ${row.player_id} to team ${team.name}`);
        } catch (error) {
          console.error(`Error migrating team member:`, error);
        }
      }
      
      console.log('Team members migration completed');
      resolve();
    });
  });
}

// Migrate team join requests
async function migrateTeamJoinRequests(teams, userIdMap) {
  return new Promise((resolve, reject) => {
    console.log('Migrating team join requests...');
    
    const sql = `SELECT * FROM team_join_requests`;
    
    teamsDb.all(sql, [], async (err, rows) => {
      if (err) {
        console.error('Error fetching team join requests from SQLite:', err);
        return reject(err);
      }
      
      console.log(`Found ${rows.length} team join requests to migrate`);
      
      for (const row of rows) {
        try {
          // Find the corresponding team and player
          const team = teams.find(t => t.sqliteId === row.team_id);
          const playerId = userIdMap[row.player_id];
          
          if (!team || !playerId) {
            console.warn(`Team ID ${row.team_id} or Player ID ${row.player_id} not found, skipping request`);
            continue;
          }
          
          // Add request to team
          team.join_requests.push({
            player_id: playerId,
            request_date: row.request_date ? new Date(row.request_date) : new Date(),
            status: row.status || 'pending'
          });
          
          // Save team
          await team.save();
          console.log(`Added join request from ${row.player_id} to team ${team.name}`);
        } catch (error) {
          console.error(`Error migrating team join request:`, error);
        }
      }
      
      console.log('Team join requests migration completed');
      resolve();
    });
  });
}

// Migrate events and registrations
function migrateEvents(userIdMap, teamIdMap) {
  return new Promise((resolve, reject) => {
    console.log('Migrating events...');
    
    const sql = `SELECT * FROM events`;
    
    mainDb.all(sql, [], async (err, rows) => {
      if (err) {
        console.error('Error fetching events from SQLite:', err);
        return reject(err);
      }
      
      console.log(`Found ${rows.length} events to migrate`);
      
      const migratedEvents = [];
      
      for (const row of rows) {
        try {
          // Map the SQLite organizer_id to MongoDB ObjectId
          const organizerId = userIdMap[row.organizer_id];
          
          if (!organizerId) {
            console.warn(`Organizer ID ${row.organizer_id} not found in user mapping, skipping event ${row.title}`);
            continue;
          }
          
          const event = new Event({
            organizer_id: organizerId,
            title: row.title,
            description: row.description || '',
            sport_type: row.sport_type,
            event_date: row.event_date ? new Date(row.event_date) : new Date(),
            event_time: row.event_time || '00:00',
            location: row.location,
            max_teams: row.max_teams || null,
            entry_fee: row.entry_fee || null,
            registration_deadline: row.registration_deadline ? new Date(row.registration_deadline) : null,
            status: row.status || 'upcoming',
            created_at: row.created_at ? new Date(row.created_at) : new Date(),
            team_registrations: [] // Will be populated later
          });
          
          // Save to MongoDB
          await event.save();
          
          // Store mapping between SQLite ID and MongoDB ID
          event.sqliteId = row.id;
          migratedEvents.push(event);
          
          console.log(`Migrated event: ${row.title}`);
        } catch (error) {
          console.error(`Error migrating event ${row.title}:`, error);
        }
      }
      
      // Now migrate event team registrations
      await migrateEventRegistrations(migratedEvents, teamIdMap);
      
      console.log(`Successfully migrated ${migratedEvents.length} events`);
      resolve(migratedEvents);
    });
  });
}

// Migrate event team registrations
async function migrateEventRegistrations(events, teamIdMap) {
  return new Promise((resolve, reject) => {
    console.log('Migrating event team registrations...');
    
    const sql = `SELECT * FROM event_team_registrations`;
    
    mainDb.all(sql, [], async (err, rows) => {
      if (err) {
        console.error('Error fetching event registrations from SQLite:', err);
        return reject(err);
      }
      
      console.log(`Found ${rows.length} event registrations to migrate`);
      
      for (const row of rows) {
        try {
          // Find the corresponding event and team
          const event = events.find(e => e.sqliteId === row.event_id);
          const teamId = teamIdMap[row.team_id];
          
          if (!event || !teamId) {
            console.warn(`Event ID ${row.event_id} or Team ID ${row.team_id} not found, skipping registration`);
            continue;
          }
          
          // Add registration to event
          event.team_registrations.push({
            team_id: teamId,
            registration_date: row.registration_date ? new Date(row.registration_date) : new Date(),
            status: row.status || 'pending'
          });
          
          // Save event
          await event.save();
          console.log(`Added team registration for team ${row.team_id} to event ${event.title}`);
        } catch (error) {
          console.error(`Error migrating event registration:`, error);
        }
      }
      
      console.log('Event registrations migration completed');
      resolve();
    });
  });
}

// Cleanup function
process.on('exit', () => {
  mainDb.close();
  teamsDb.close();
  mongoose.disconnect();
  console.log('Database connections closed');
});

// Handle errors and termination
process.on('SIGINT', () => {
  console.log('Migration interrupted');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
}); 