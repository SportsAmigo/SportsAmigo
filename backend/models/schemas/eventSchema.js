const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Event schema
const eventSchema = new Schema({
  organizer_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  sport_type: { 
    type: String, 
    required: true 
  },
  event_date: { 
    type: Date, 
    required: true 
  },
  event_time: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  max_teams: Number,
  entry_fee: Number,
  registration_deadline: Date,
  status: { 
    type: String, 
    default: 'upcoming',
    enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  // Team registrations as a subdocument array
  team_registrations: [{
    team_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'Team' 
    },
    registration_date: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      default: 'pending',
      enum: ['pending', 'confirmed', 'cancelled']
    }
  }]
});

module.exports = mongoose.model('Event', eventSchema); 