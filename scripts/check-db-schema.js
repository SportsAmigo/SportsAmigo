const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, '../database/sportsamigo.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to the SportsAmigo database');
});

// Get the schema of the users table
db.all("PRAGMA table_info(users)", [], (err, rows) => {
  if (err) {
    console.error('Error getting table schema:', err.message);
    return;
  }
  
  console.log('Users table schema:');
  rows.forEach((row) => {
    console.log(`Column ${row.cid}: ${row.name} (${row.type})`);
  });
  
  // After getting the users schema, check the user_profiles schema
  db.all("PRAGMA table_info(user_profiles)", [], (err, rows) => {
    if (err) {
      console.error('Error getting user_profiles schema:', err.message);
      return;
    }
    
    console.log('\nUser_profiles table schema:');
    rows.forEach((row) => {
      console.log(`Column ${row.cid}: ${row.name} (${row.type})`);
    });
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  });
}); 