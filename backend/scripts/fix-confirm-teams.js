/**
 * DATABASE FIX SCRIPT
 * This script confirms ALL pending team registrations in your event
 * Run this: node fix-confirm-teams.js
 */

const mongoose = require('mongoose');
const Event = require('./models/schemas/eventSchema');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';
const EVENT_ID = '692e1a4851263793184be75'; // Your event ID from the screenshot

async function confirmAllTeams() {
    try {
        console.log('\n🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log(`🔍 Finding event: ${EVENT_ID}\n`);
        
        const event = await Event.findById(EVENT_ID);
        
        if (!event) {
            console.error('❌ Event not found!');
            console.log('Available events:');
            const allEvents = await Event.find({}).select('_id title');
            allEvents.forEach(e => console.log(`  - ${e._id}: ${e.title}`));
            process.exit(1);
        }

        console.log(`📋 Event: ${event.title}`);
        console.log(`📊 Total registrations: ${event.team_registrations?.length || 0}\n`);

        if (!event.team_registrations || event.team_registrations.length === 0) {
            console.log('⚠️  No team registrations found!');
            process.exit(0);
        }

        // Show current status
        const pendingCount = event.team_registrations.filter(r => r.status === 'pending').length;
        const confirmedCount = event.team_registrations.filter(r => r.status === 'confirmed').length;
        
        console.log('Current Status:');
        console.log(`  ✅ Confirmed: ${confirmedCount}`);
        console.log(`  ⏳ Pending: ${pendingCount}\n`);

        if (pendingCount === 0) {
            console.log('✅ All teams are already confirmed!');
            process.exit(0);
        }

        console.log('🔄 Confirming all pending teams...\n');

        // Update all pending to confirmed
        let confirmedTeams = 0;
        for (let i = 0; i < event.team_registrations.length; i++) {
            if (event.team_registrations[i].status === 'pending') {
                event.team_registrations[i].status = 'confirmed';
                confirmedTeams++;
                console.log(`  ✅ Confirmed team ${i + 1}`);
            }
        }

        await event.save();

        console.log(`\n✅ Successfully confirmed ${confirmedTeams} teams!`);
        console.log(`\n📊 New Status:`);
        console.log(`  ✅ Confirmed: ${event.team_registrations.filter(r => r.status === 'confirmed').length}`);
        console.log(`  ⏳ Pending: ${event.team_registrations.filter(r => r.status === 'pending').length}`);
        
        console.log('\n✅ Done! Now refresh your browser and you should see all teams.\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB\n');
        process.exit(0);
    }
}

confirmAllTeams();
