const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Profile schema for extended user information
const profileSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  address: String,
  city: String,
  state: String,
  postal_code: String,
  country: String,
  date_of_birth: Date,
  gender: String,
  emergency_contact: {
    name: String,
    relationship: String,
    phone: String
  },
  interests: [String],
  education: String,
  occupation: String,
  joined_teams: [{
    team_id: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    joined_date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    }
  }],
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Profile', profileSchema); 