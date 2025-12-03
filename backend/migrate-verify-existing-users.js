/**
 * Migration Script: Mark all existing users as email verified
 * Run this once to verify all users created before OTP implementation
 * 
 * Usage: node migrate-verify-existing-users.js
 */

const mongoose = require('./config/mongodb');
const User = require('./models/schemas/userSchema');

async function migrateExistingUsers() {
    try {
        console.log('Starting migration: Verifying existing users...');
        
        // Find all users where isEmailVerified is false or undefined
        const unverifiedUsers = await User.find({
            $or: [
                { isEmailVerified: false },
                { isEmailVerified: { $exists: false } }
            ]
        });

        console.log(`Found ${unverifiedUsers.length} unverified users`);

        if (unverifiedUsers.length === 0) {
            console.log('No users to migrate. All users are already verified.');
            process.exit(0);
        }

        // Update all existing users to verified
        const result = await User.updateMany(
            {
                $or: [
                    { isEmailVerified: false },
                    { isEmailVerified: { $exists: false } }
                ]
            },
            {
                $set: {
                    isEmailVerified: true,
                    emailVerifiedAt: new Date()
                }
            }
        );

        console.log(`Migration complete! Updated ${result.modifiedCount} users.`);
        console.log('All existing users are now verified and can login.');

        // List migrated users
        console.log('\nVerified users:');
        unverifiedUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.first_name} ${user.last_name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateExistingUsers();
