const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Registration schema
const registrationSchema = new Schema({
  team_id: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  event_id: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  player_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional, as not all registrations link directly to players
  },
  registration_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paid: {
    type: Boolean,
    default: false
  },
  payment_amount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Create a compound index to ensure a team can only register once for an event
registrationSchema.index({ team_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema); 