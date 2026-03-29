/**
 * SUPER SIMPLE FIX - No dependencies, just confirms teams
 * Run: node super-simple-fix.js 692e1a4851263793184be75
 */

const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'sportsamigo';
const eventId = process.argv[2] || '692e1a4851263793184be75';

async function fix() {
    const client = new MongoClient(uri);
    
    try {
        console.log('\n🔧 SUPER SIMPLE FIX\n');
        console.log('Connecting...');
        await client.connect();
        
        const db = client.db(dbName);
        const events = db.collection('events');
        
        console.log(`Finding event: ${eventId}\n`);
        
        const event = await events.findOne({ _id: new ObjectId(eventId) });
        
        if (!event) {
            console.log('❌ Event not found!');
            return;
        }
        
        console.log(`Event: ${event.title}`);
        console.log(`Teams: ${event.team_registrations?.length || 0}\n`);
        
        if (!event.team_registrations || event.team_registrations.length === 0) {
            console.log('No teams to fix!');
            return;
        }
        
        // Show current status
        console.log('Current status:');
        event.team_registrations.forEach((reg, i) => {
            console.log(`  ${i + 1}. Status: ${reg.status || 'UNDEFINED'}`);
        });
        
        // Set ALL to confirmed
        console.log('\nSetting ALL to confirmed...');
        event.team_registrations.forEach((reg, i) => {
            reg.status = 'confirmed';
        });
        
        await events.updateOne(
            { _id: new ObjectId(eventId) },
            { $set: { team_registrations: event.team_registrations } }
        );
        
        console.log('✅ Done!\n');
        console.log('New status:');
        event.team_registrations.forEach((reg, i) => {
            console.log(`  ${i + 1}. Status: ${reg.status}`);
        });
        
        console.log('\n✅ All teams confirmed! Refresh your browser.\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

fix();
