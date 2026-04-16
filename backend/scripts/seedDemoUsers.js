/**
 * Seed script — create three demo users for faculty review.
 *
 * Usage:
 *   MONGO_URI=<your_atlas_uri> node scripts/seedDemoUsers.js
 *
 * Credentials:
 *   Organizer: organizer@demo.com / Demo@123
 *   Player:    player@demo.com    / Demo@123
 *   Admin:     admin@demo.com     / Demo@123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI env variable is required');
    process.exit(1);
}

const UserSchema = require('../models/schemas/userSchema');

const DEMO_USERS = [
    {
        email: 'organizer@demo.com',
        password: 'Demo@123',
        first_name: 'Demo',
        last_name: 'Organizer',
        role: 'organizer',
        verificationStatus: 'verified',
        isEmailVerified: true,
        bio: 'Faculty demo organizer account'
    },
    {
        email: 'player@demo.com',
        password: 'Demo@123',
        first_name: 'Demo',
        last_name: 'Player',
        role: 'player',
        verificationStatus: 'verified',
        isEmailVerified: true,
        bio: 'Faculty demo player account',
        walletBalance: 5000,
        walletStatus: 'Active'
    },
    {
        email: 'admin@demo.com',
        password: 'Demo@123',
        first_name: 'Demo',
        last_name: 'Admin',
        role: 'admin',
        verificationStatus: 'verified',
        isEmailVerified: true,
        bio: 'Faculty demo admin account'
    }
];

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const user of DEMO_USERS) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        await UserSchema.findOneAndUpdate(
            { email: user.email },
            {
                ...user,
                password: hashedPassword
            },
            { upsert: true, new: true }
        );
        console.log(`Upserted: ${user.email} (${user.role})`);
    }

    console.log('\nDemo credentials:');
    console.log('  organizer@demo.com / Demo@123');
    console.log('  player@demo.com    / Demo@123');
    console.log('  admin@demo.com     / Demo@123');

    await mongoose.disconnect();
    console.log('\nDone.');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
