/**
 * Seed script to initialize wallet balances for existing users
 * This script adds initial wallet balance to users for testing purposes
 */

const mongoose = require('./config/mongodb');
const UserSchema = require('./models/schemas/userSchema');
const WalletTransactionSchema = require('./models/schemas/walletTransactionSchema');

async function seedWalletBalances() {
    try {
        console.log('🚀 Starting wallet balance seeding...');
        
        // Find all users who don't have a wallet balance set
        const users = await UserSchema.find({
            $or: [
                { walletBalance: { $exists: false } },
                { walletBalance: 0 }
            ]
        });
        
        console.log(`📊 Found ${users.length} users to update`);
        
        for (const user of users) {
            // Give different amounts based on user role
            let initialBalance = 0;
            
            switch (user.role) {
                case 'player':
                    initialBalance = 1000; // ₹1000 for players
                    break;
                case 'manager':
                    initialBalance = 2000; // ₹2000 for managers  
                    break;
                case 'organizer':
                    initialBalance = 5000; // ₹5000 for organizers
                    break;
                case 'admin':
                    initialBalance = 10000; // ₹10000 for admins
                    break;
                default:
                    initialBalance = 500; // ₹500 for others
            }
            
            // Update user wallet balance
            await UserSchema.findByIdAndUpdate(user._id, {
                walletBalance: initialBalance
            });
            
            // Create a wallet transaction record
            await WalletTransactionSchema.create({
                playerId: user._id,
                transactionType: 'Credit',
                amount: initialBalance,
                description: 'Initial wallet balance - Welcome bonus',
                balanceAfter: initialBalance,
                status: 'Completed',
                referenceId: `WELCOME_${Date.now()}_${user._id.toString().slice(-4)}`
            });
            
            console.log(`✅ Added ₹${initialBalance} to ${user.first_name} ${user.last_name} (${user.role})`);
        }
        
        console.log('🎉 Wallet balance seeding completed successfully!');
        
        // Display summary
        const totalUsers = await UserSchema.countDocuments();
        const totalWalletBalance = await UserSchema.aggregate([
            { $group: { _id: null, total: { $sum: '$walletBalance' } } }
        ]);
        
        console.log('\n📈 Summary:');
        console.log(`Total Users: ${totalUsers}`);
        console.log(`Total Wallet Balance: ₹${totalWalletBalance[0]?.total || 0}`);
        console.log(`Total Transactions Created: ${users.length}`);
        
    } catch (error) {
        console.error('❌ Error seeding wallet balances:', error);
    } finally {
        console.log('Closing database connection...');
        mongoose.connection.close();
    }
}

// Run the seeding function
if (require.main === module) {
    seedWalletBalances();
}

module.exports = seedWalletBalances;