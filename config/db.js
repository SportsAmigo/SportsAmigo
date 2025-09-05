const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, '../database/sportsamigo.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to SQLite database');
    
    // Create tables if they don't exist
    db.serialize(() => {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        // Update tables structure or create if not exist
        // User Profiles table - stores role-specific profile data
        db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            age INTEGER,
            address TEXT,
            join_date DATE DEFAULT CURRENT_DATE,
            preferred_sports TEXT,  -- For players (comma-separated)
            organization_name TEXT,  -- For organizers
            team_name TEXT,         -- For managers
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Teams table - stores teams created by managers
        db.run(`CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            manager_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            sport_type TEXT NOT NULL,
            description TEXT,
            max_members INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Team Join Requests table - stores player requests to join teams
        db.run(`CREATE TABLE IF NOT EXISTS team_join_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(team_id, player_id)
        )`);

        // Team Members table - stores approved players in teams
        db.run(`CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            joined_date DATE DEFAULT CURRENT_DATE,
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(team_id, player_id)
        )`);

        // Event Team Registrations table - stores team registrations for events
        db.run(`CREATE TABLE IF NOT EXISTS event_team_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            team_id INTEGER NOT NULL,
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled')),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            UNIQUE(event_id, team_id)
        )`);

        console.log('Database tables created/verified successfully');
        
        // Check if we need to create sample data
        db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
            if (err) {
                console.error('Error checking user count:', err);
                return;
            }
            
            // If no users, create sample data
            if (result.count === 0) {
                createSampleData();
            }
        });
    });
});

// Add sample data for testing
function createSampleData() {
    console.log('Creating sample data...');
    
    // Sample users (password: password123)
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    const sampleUsers = [
        { email: 'admin@example.com', password: hashedPassword, role: 'manager', first_name: 'Admin', last_name: 'User', phone: '1234567890' },
        { email: 'player@example.com', password: hashedPassword, role: 'player', first_name: 'John', last_name: 'Doe', phone: '9876543210' },
        { email: 'organizer@example.com', password: hashedPassword, role: 'organizer', first_name: 'Event', last_name: 'Planner', phone: '5551234567' }
    ];
    
    sampleUsers.forEach(user => {
        const userSql = `
            INSERT INTO users (email, password, role, first_name, last_name, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.run(userSql, [user.email, user.password, user.role, user.first_name, user.last_name, user.phone], function(err) {
            if (err) {
                console.error('Error creating sample user:', err);
                return;
            }
            
            const userId = this.lastID;
            console.log(`Created sample user: ${user.email} (ID: ${userId})`);
            
            // Create profile data
            if (user.role === 'player') {
                db.run(`
                    INSERT INTO user_profiles (user_id, preferred_sports)
                    VALUES (?, ?)
                `, [userId, 'Basketball,Football,Tennis'], err => {
                    if (err) console.error('Error creating player profile:', err);
                });
            } else if (user.role === 'organizer') {
                db.run(`
                    INSERT INTO user_profiles (user_id, organization_name)
                    VALUES (?, ?)
                `, [userId, 'Sports Events Inc.'], err => {
                    if (err) console.error('Error creating organizer profile:', err);
                });
            } else if (user.role === 'manager') {
                db.run(`
                    INSERT INTO user_profiles (user_id, team_name)
                    VALUES (?, ?)
                `, [userId, 'Champions Team'], err => {
                    if (err) console.error('Error creating manager profile:', err);
                });
                
                // Create a team for this manager
                setTimeout(() => {
                    db.run(`
                        INSERT INTO teams (manager_id, name, sport_type, max_members)
                        VALUES (?, ?, ?, ?)
                    `, [userId, 'Champions Team', 'Basketball', 10], function(err) {
                        if (err) {
                            console.error('Error creating sample team:', err);
                        } else {
                            console.log(`Created sample team for manager ${userId}`);
                        }
                    });
                }, 500);
            }
        });
    });
}

module.exports = db; 