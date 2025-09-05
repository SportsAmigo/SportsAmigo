/**
 * Create an admin user for testing purposes
 * 
 * Usage: node scripts/create-admin-user.js
 */

// Import required modules
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

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

// Admin user details
const adminUser = {
  email: 'admin@sportsapp.com',
  password: 'password',  // This will be hashed
  role: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  phone: '1234567890',
  bio: 'System administrator',
  profile: {
    join_date: new Date()
  }
};

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      mongoose.connection.close();
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    adminUser.password = hashedPassword;
    
    // Create user
    const user = new User(adminUser);
    await user.save();
    
    console.log('Admin user created successfully:', user.email);
    
    // Close database connection
    mongoose.connection.close();
  } catch (err) {
    console.error('Error creating admin user:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
createAdminUser(); 