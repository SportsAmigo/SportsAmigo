/**
 * Check admin user credentials
 * 
 * Usage: node scripts/check-admin-user.js
 */

// Import required modules
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsAmigo';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Import User model
const User = require('../models/schemas/userSchema');

// Admin credentials to check
const adminEmail = 'admin@sportsapp.com';
const adminPassword = 'password';

async function checkAdminCredentials() {
  try {
    // Find admin user
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('Admin user not found');
      mongoose.connection.close();
      return;
    }
    
    console.log('Admin found:', {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      first_name: admin.first_name,
      last_name: admin.last_name
    });
    
    // Check password
    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    
    if (isMatch) {
      console.log('Password matches!');
    } else {
      console.log('Password does NOT match');
    }
    
    // Close database connection
    mongoose.connection.close();
  } catch (err) {
    console.error('Error checking admin credentials:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
checkAdminCredentials(); 