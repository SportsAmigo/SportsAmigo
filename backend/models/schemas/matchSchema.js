const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: false,
        default: null
    },
    team_a: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    team_b: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    team_a_name: {
        type: String,
        required: true
    },
    team_b_name: {
        type: String,
        required: true
    },
    score_a: {
        type: Number,
        default: 0
    },
    score_b: {
        type: Number,
        default: 0
    },
    match_date: {
        type: Date,
        required: true
    },
    match_type: {
        type: String,
        enum: ['friendly', 'tournament', 'league'],
        default: 'friendly'
    },
    status: {
        type: String,
        enum: ['scheduled', 'live', 'pending', 'verified', 'disputed', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    round: {
        type: String,
        default: null
    },
    match_number: {
        type: Number,
        default: null
    },
    scheduled_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    scheduled_at: {
        type: Date,
        default: Date.now
    },
    winner: {
        type: String,
        enum: ['team_a', 'team_b', 'draw', null],
        default: null
    },
    venue: {
        type: String,
        required: false
    },
    recorded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verified_at: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    },
    dispute_reason: {
        type: String,
        default: ''
    },
    rejection_reason: {
        type: String,
        default: ''
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

// Update timestamp on save
matchSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('Match', matchSchema);
