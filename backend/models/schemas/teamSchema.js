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
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
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
    },
    stats: {
      matches_played: { type: Number, default: 0 },
      matches_won: { type: Number, default: 0 },
      matches_lost: { type: Number, default: 0 },
      matches_drawn: { type: Number, default: 0 },
      last_updated: Date
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

// Pre-save middleware to validate that players don't join multiple teams in the same sport
teamSchema.pre('save', async function(next) {
  try {
    // Only validate if members array has been modified
    if (!this.isModified('members')) {
      return next();
    }
    
    // Get all active player IDs in this team
    const activePlayerIds = this.members
      .filter(member => member.status === 'active')
      .map(member => member.player_id);
    
    if (activePlayerIds.length === 0) {
      return next();
    }
    
    // Check if any of these players are already in another team of the same sport
    const Team = this.constructor; // Get the Team model
    const conflictingTeams = await Team.find({
      _id: { $ne: this._id }, // Exclude current team
      sport_type: this.sport_type,
      'members.player_id': { $in: activePlayerIds },
      'members.status': 'active'
    }).select('name members.player_id').exec();
    
    if (conflictingTeams.length > 0) {
      // Find which player(s) have conflicts
      const conflictingPlayers = [];
      for (const team of conflictingTeams) {
        for (const member of team.members) {
          if (activePlayerIds.some(id => id.toString() === member.player_id.toString())) {
            conflictingPlayers.push({
              playerId: member.player_id,
              teamName: team.name
            });
          }
        }
      }
      
      const error = new Error(
        `Cannot add player(s) to team. The following player(s) are already in another ${this.sport_type} team: ${
          conflictingPlayers.map(p => `Player is in "${p.teamName}"`).join(', ')
        }. A player can only join one team per sport.`
      );
      return next(error);
    }
    
    next();
  } catch (err) {
    next(err);
  }
});

// Text index supports MongoDB full-text fallback search when Solr is unavailable.
teamSchema.index({
  name: 'text',
  description: 'text',
  sport_type: 'text'
});

module.exports = mongoose.model('Team', teamSchema); 