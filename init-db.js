const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Database paths
const dbDir = path.join(__dirname, 'database');
const dbPath = path.join(dbDir, 'sportsamigo.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
    console.log('Creating database directory');
    fs.mkdirSync(dbDir, { recursive: true });
}

// Remove old database file if it exists
if (fs.existsSync(dbPath)) {
    console.log('Removing old database file');
    fs.unlinkSync(dbPath);
}

// Create main database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
    
    console.log('Database connected');
    initializeDatabase();
});

function initializeDatabase() {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Create tables
    db.serialize(() => {
        // Users table - stores all user types (player, organizer, manager)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('player', 'organizer', 'manager')),
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            bio TEXT,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, err => {
        if (err) {
            console.error('Error creating users table:', err);
            } else {
                console.log('Users table created');
        }
    });
    
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
        )`, err => {
        if (err) {
                console.error('Error creating user_profiles table:', err);
            } else {
                console.log('User profiles table created');
        }
    });
    
        // Events table - stores events created by organizers
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
            organizer_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
            sport_type TEXT NOT NULL,
            event_date DATE NOT NULL,
            event_time TIME NOT NULL,
        location TEXT NOT NULL,
            max_teams INTEGER,      -- Maximum number of teams allowed
            entry_fee DECIMAL(10,2),
            registration_deadline DATE,
            status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
        )`, err => {
        if (err) {
            console.error('Error creating events table:', err);
            } else {
                console.log('Events table created');
            }
        });

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
        )`, err => {
            if (err) {
                console.error('Error creating teams table:', err);
            } else {
                console.log('Teams table created');
            }
        });

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
        )`, err => {
            if (err) {
                console.error('Error creating team_join_requests table:', err);
            } else {
                console.log('Team join requests table created');
            }
        });

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
        )`, err => {
            if (err) {
                console.error('Error creating team_members table:', err);
            } else {
                console.log('Team members table created');
            }
        });

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
        )`, err => {
            if (err) {
                console.error('Error creating event_team_registrations table:', err);
            } else {
                console.log('Event team registrations table created');
            }
        });

        createSampleData();
    });
}

// Create sample data for testing
function createSampleData() {
    // Sample data creation
    console.log('Creating sample data...');

    // Sample users (password: password123)
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    const sampleUsers = [
        { email: 'admin@example.com', password: hashedPassword, role: 'manager', first_name: 'Admin', last_name: 'User' },
        { email: 'player1@example.com', password: hashedPassword, role: 'player', first_name: 'John', last_name: 'Doe' },
        { email: 'player2@example.com', password: hashedPassword, role: 'player', first_name: 'Jane', last_name: 'Smith' },
        { email: 'organizer@example.com', password: hashedPassword, role: 'organizer', first_name: 'Event', last_name: 'Planner' },
        { email: 'manager@example.com', password: hashedPassword, role: 'manager', first_name: 'Team', last_name: 'Manager' }
    ];

    // Insert users
    const insertUserStmt = db.prepare('INSERT INTO users (email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)');
    
    sampleUsers.forEach(user => {
        insertUserStmt.run(user.email, user.password, user.role, user.first_name, user.last_name, function(err) {
            if (err) {
                console.error('Error creating sample user:', err);
            } else {
                const userId = this.lastID;
                console.log(`Created sample user: ${user.email} (ID: ${userId})`);
                
                // Create profile data
                if (user.role === 'player') {
                    db.run('INSERT INTO user_profiles (user_id, preferred_sports) VALUES (?, ?)', 
                          [userId, 'Basketball,Football,Tennis'], err => {
                        if (err) console.error('Error creating player profile:', err);
                    });
                } else if (user.role === 'organizer') {
                    db.run('INSERT INTO user_profiles (user_id, organization_name) VALUES (?, ?)', 
                          [userId, 'Sports Events Inc.'], err => {
                        if (err) console.error('Error creating organizer profile:', err);
                    });
                } else if (user.role === 'manager') {
                    db.run('INSERT INTO user_profiles (user_id, team_name) VALUES (?, ?)', 
                          [userId, 'Champions Team'], err => {
                        if (err) console.error('Error creating manager profile:', err);
                    });
                    
                    // Create a team for this manager
                    db.run('INSERT INTO teams (manager_id, name, sport_type, max_members) VALUES (?, ?, ?, ?)',
                          [userId, 'Champions Team', 'Basketball', 10], function(err) {
          if (err) {
                            console.error('Error creating sample team:', err);
          } else {
                            console.log(`Created sample team for manager ${userId}`);
          }
        });
      }
    }
        });
    });
    
    insertUserStmt.finalize();

    // Create sample events
    const sampleEvents = [
        { title: 'Basketball Tournament', sport_type: 'Basketball', event_date: '2025-05-15', event_time: '10:00:00',
          location: 'City Stadium', max_teams: 8, description: 'Annual basketball championship' },
        { title: 'Football Match', sport_type: 'Football', event_date: '2025-06-22', event_time: '14:00:00', 
          location: 'Community Park', max_teams: 6, description: 'Friendly football tournament' }
    ];

    // Insert events (after getting organizer ID)
    db.get('SELECT id FROM users WHERE role = "organizer" LIMIT 1', (err, organizer) => {
        if (err || !organizer) {
            console.error('Error finding organizer for sample events:', err);
            return;
        }

        const insertEventStmt = db.prepare(
            'INSERT INTO events (organizer_id, title, sport_type, event_date, event_time, location, max_teams, description) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );

        sampleEvents.forEach(event => {
            insertEventStmt.run(
                organizer.id, event.title, event.sport_type, event.event_date, event.event_time, 
                event.location, event.max_teams, event.description,
                err => {
                    if (err) console.error('Error creating sample event:', err);
                }
            );
        });
        
        insertEventStmt.finalize();
    });

    console.log('Database initialization complete');
}

// Close database connection when done
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
    });
}); 