// Create events table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sport_type TEXT NOT NULL,
        description TEXT,
        location TEXT NOT NULL,
        max_teams INTEGER DEFAULT 10,
        event_date TEXT NOT NULL,
        event_time TEXT DEFAULT '10:00',
        registration_deadline TEXT,
        status TEXT DEFAULT 'upcoming',
        organizer_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id)
    )
`, (err) => {
    if (err) {
        console.error('Error creating events table:', err.message);
    } else {
        console.log('Events table created or already exists');
    }
});

// Create event_team_registrations table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS event_team_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        team_id INTEGER,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (team_id) REFERENCES teams(id)
    )
`, (err) => {
    if (err) {
        console.error('Error creating event_team_registrations table:', err.message);
    } else {
        console.log('Event team registrations table created or already exists');
    }
}); 