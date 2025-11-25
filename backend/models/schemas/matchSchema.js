const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
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
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
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
