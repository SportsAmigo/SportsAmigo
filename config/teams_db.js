const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database file for teams
const teamsDbPath = path.join(__dirname, '../database/teams.db');
const teamsDb = new sqlite3.Database(teamsDbPath, (err) => {
    if (err) {
        console.error('Error connecting to teams database:', err.message);
    } else {
        console.log('Connected to teams database at', teamsDbPath);
        setupTeamsDatabase();
    }
});

// Initialize the teams database schema
function setupTeamsDatabase() {
    teamsDb.serialize(() => {
        // Create teams table
        teamsDb.run(`
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sport_type TEXT NOT NULL,
            manager_id INTEGER NOT NULL,
            description TEXT,
            max_members INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `);

        // Create team_members table
        teamsDb.run(`
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active'
        )
        `);

        // Create team_join_requests table
        teamsDb.run(`
        CREATE TABLE IF NOT EXISTS team_join_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending'
        )
        `);

        console.log('Teams database tables created/verified successfully');
    });
}

module.exports = teamsDb; 