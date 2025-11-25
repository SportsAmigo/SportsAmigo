const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Team schema
const teamSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  sport_type: { 
    type: String, 
    required: true 
  },
  manager_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  description: String,
  max_members: Number,
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  // Team members as a subdocument array
  members: [{
    player_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    joined_date: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      default: 'active',
      enum: ['active', 'inactive']
    }
  }],
  // Join requests as a subdocument array
  join_requests: [{
    player_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    request_date: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      default: 'pending',
      enum: ['pending', 'approved', 'rejected']
    }
  }]
});

module.exports = mongoose.model('Team', teamSchema); 