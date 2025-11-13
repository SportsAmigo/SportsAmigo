const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Event Template schema
const templateSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  sport: { 
    type: String, 
    required: true 
  },
  description: String,
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  last_used: { 
    type: Date, 
    default: null 
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Default values for events created from this template
  default_values: {
    max_teams: Number,
    entry_fee: Number,
    registration_period_days: Number,
    event_duration_hours: Number,
    location: String
  }
});

module.exports = mongoose.model('Template', templateSchema); 