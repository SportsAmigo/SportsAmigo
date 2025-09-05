/**
 * Central export point for all models
 */

// Export all models for easy access
module.exports = {
    User: require('./user'),
    Team: require('./team'),
    Event: require('./event'),
    Profile: require('./profile'),
    PlayerProfile: require('./playerProfile'),
    Registration: require('./registration'),
    Template: require('./template')
}; 