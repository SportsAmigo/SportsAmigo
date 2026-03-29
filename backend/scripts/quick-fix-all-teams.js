/**
 * ⚡ QUICK FIX - Auto-confirm all pending teams in ALL events
 * Run: node quick-fix-all-teams.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

async function quickFix() {
    try {
        console.log('\n⚡ QUICK FIX - Confirming All Pending Teams\n');
        console.log('🔌 Connecting to MongoDB...');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!\n');

        // Direct MongoDB query
        const db = mongoose.connection.db;
        const eventsCollection = db.collection('events');

        // Update ALL registrations to confirmed (handle pending, registered, undefined)
        const result1 = await eventsCollection.updateMany(
            { 'team_registrations.status': 'pending' },
            { $set: { 'team_registrations.$[elem].status': 'confirmed' } },
            { arrayFilters: [{ 'elem.status': 'pending' }] }
        );

        const result2 = await eventsCollection.updateMany(
            { 'team_registrations.status': 'registered' },
            { $set: { 'team_registrations.$[elem].status': 'confirmed' } },
            { arrayFilters: [{ 'elem.status': 'registered' }] }
        );

        // Handle undefined/null status
        const result3 = await eventsCollection.updateMany(
            { 'team_registrations': { $exists: true } },
            { $set: { 'team_registrations.$[elem].status': 'confirmed' } },
            { arrayFilters: [{ 'elem.status': { $exists: false } }] }
        );

        const totalModified = result1.modifiedCount + result2.modifiedCount + result3.modifiedCount;
        
        console.log('✅ Update Complete!');
        console.log(`📊 Modified ${totalModified} event(s)`);
        console.log(`   - Pending: ${result1.modifiedCount}`);
        console.log(`   - Registered: ${result2.modifiedCount}`);
        console.log(`   - Undefined: ${result3.modifiedCount}\n`);

        // Show summary
        const events = await eventsCollection.find({}).toArray();
        console.log('📋 Events Summary:\n');
        
        for (const event of events) {
            if (event.team_registrations && event.team_registrations.length > 0) {
                const confirmed = event.team_registrations.filter(r => r.status === 'confirmed').length;
                const total = event.team_registrations.length;
                console.log(`  ${event.title}:`);
                console.log(`    ✅ ${confirmed}/${total} teams confirmed`);
            }
        }

        console.log('\n✅ All teams are now confirmed!');
        console.log('💡 Refresh your browser to see the changes\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

quickFix();
