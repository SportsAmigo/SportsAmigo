const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Player Profile schema
const playerProfileSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  position: String,
  skill_level: String,
  years_experience: Number,
  achievements: String,
  preferred_team_types: String,
  availability: String,
  stats: {
    games_played: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('PlayerProfile', playerProfileSchema); 