const db = require('./db');

// Initialize database schema
function setupDatabase() {
    db.serialize(() => {
        // Create users table
        db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            profile_image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `);

        // Create user_profiles table
        db.run(`
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            age INTEGER,
            address TEXT,
            bio TEXT,
            join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            preferred_sports TEXT,
            organization_name TEXT,
            team_name TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        `);

        // Create teams table
        db.run(`
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sport_type TEXT NOT NULL,
            manager_id INTEGER NOT NULL,
            description TEXT,
            max_members INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (manager_id) REFERENCES users(id)
        )
        `);

        // Create team_members table
        db.run(`
        CREATE TABLE IF NOT EXISTS team_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (team_id) REFERENCES teams(id),
            FOREIGN KEY (player_id) REFERENCES users(id),
            UNIQUE(team_id, player_id)
        )
        `);

        // Create team_join_requests table
        db.run(`
        CREATE TABLE IF NOT EXISTS team_join_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER NOT NULL,
            player_id INTEGER NOT NULL,
            request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (team_id) REFERENCES teams(id),
            FOREIGN KEY (player_id) REFERENCES users(id),
            UNIQUE(team_id, player_id)
        )
        `);

        // Create events table
        db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            event_date DATE NOT NULL,
            location TEXT NOT NULL,
            sport TEXT,
            status TEXT DEFAULT 'upcoming',
            registration_deadline DATE,
            max_participants INTEGER,
            current_participants INTEGER DEFAULT 0,
            organizer_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organizer_id) REFERENCES users(id)
        )
        `);

        // Create event_team_registrations table
        db.run(`
        CREATE TABLE IF NOT EXISTS event_team_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            team_id INTEGER NOT NULL,
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'registered',
            FOREIGN KEY (event_id) REFERENCES events(id),
            FOREIGN KEY (team_id) REFERENCES teams(id),
            UNIQUE(event_id, team_id)
        )
        `);

        // Add missing columns to tables if they don't exist
        checkAndAddColumns();
    });
}

// Function to check if a column exists in a table
function columnExists(tableName, columnName, callback) {
    const sql = `PRAGMA table_info(${tableName})`;
    db.all(sql, [], (err, columns) => {
        if (err) {
            console.error(`Error checking columns for table ${tableName}:`, err);
            callback(false);
            return;
        }
        
        const column = columns.find(col => col.name === columnName);
        callback(!!column);
    });
}

// Add missing columns to tables if needed
function checkAndAddColumns() {
    // Check and add to users table
    columnExists('users', 'bio', exists => {
        if (!exists) {
            db.run('ALTER TABLE users ADD COLUMN bio TEXT');
        }
    });
    
    // Check and add organization column to users table
    columnExists('users', 'organization', exists => {
        if (!exists) {
            console.log('Adding organization column to users table');
            db.run('ALTER TABLE users ADD COLUMN organization TEXT');
        }
    });

    // Check and add to user_profiles table
    columnExists('user_profiles', 'preferred_sports', exists => {
        if (!exists) {
            db.run('ALTER TABLE user_profiles ADD COLUMN preferred_sports TEXT');
        }
    });

    columnExists('user_profiles', 'bio', exists => {
        if (!exists) {
            db.run('ALTER TABLE user_profiles ADD COLUMN bio TEXT');
        }
    });

    // Check and add to events table
    columnExists('events', 'sport', exists => {
        if (!exists) {
            db.run('ALTER TABLE events ADD COLUMN sport TEXT');
        }
    });
}

// Run the setup
setupDatabase();

console.log('Database setup complete.');

module.exports = { setupDatabase }; 