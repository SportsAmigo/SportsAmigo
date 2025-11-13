const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User schema
const userSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true,
    enum: ['player', 'organizer', 'manager', 'admin'] 
  },
  first_name: { 
    type: String, 
    required: true 
  },
  last_name: { 
    type: String, 
    required: true 
  },
  phone: String,
  bio: String,
  profile_image: String,
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  // User profile fields embedded in the user document
  profile: {
    age: Number,
    address: String,
    join_date: { 
      type: Date, 
      default: Date.now 
    },
    preferred_sports: String,  // For players (comma-separated)
    organization_name: String, // For organizers
    team_name: String          // For managers
  },
  // Wallet balance for players
  walletBalance: {
    type: Number,
    default: 1000, // Starting balance of ₹1000
    min: 0
  },
  // Wallet status
  walletStatus: {
    type: String,
    enum: ['Active', 'Suspended', 'Closed'],
    default: 'Active'
  }
});

module.exports = mongoose.model('User', userSchema); 