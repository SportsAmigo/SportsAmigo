/**
 * Script to fix existing events that were created with 'upcoming' status
 * They should be set to 'pending_approval' to require coordinator approval
 */

const mongoose = require('../config/mongodb');
const Event = require('../models/schemas/eventSchema');

async function fixEventStatus() {
    try {
        console.log('Connecting to database...');
        
        // Find all events created today with 'upcoming' status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const eventsToFix = await Event.find({
            status: 'upcoming',
            created_at: { $gte: today }
        });
        
        console.log(`Found ${eventsToFix.length} events created today with 'upcoming' status`);
        
        if (eventsToFix.length === 0) {
            console.log('No events to fix');
            process.exit(0);
        }
        
        // Update each event to pending_approval
        for (const event of eventsToFix) {
            console.log(`Fixing event: ${event.title} (${event._id})`);
            event.status = 'pending_approval';
            await event.save();
        }
        
        console.log(`✅ Successfully updated ${eventsToFix.length} events to 'pending_approval' status`);
        console.log('These events now require coordinator approval before being visible to players');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing events:', error);
        process.exit(1);
    }
}

fixEventStatus();
