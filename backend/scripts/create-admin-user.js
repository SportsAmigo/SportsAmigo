/**
 * Script to create an admin user in the database
 * Run this script: node create-admin-user.js
 */

const mongoose = require('./config/mongodb');
const User = require('./models/user');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    try {
        console.log('🔐 Creating Admin User...\n');

        // Admin user details
        const adminData = {
            email: 'admin@sportsamigo.com',
            password: 'Admin@2026!Secure',
            role: 'admin',
            first_name: 'Admin',
            last_name: 'User',
            phone: '+1234567890',
            bio: 'System Administrator',
            isEmailVerified: true,
            emailVerifiedAt: new Date()
        };

        // Check if admin already exists
        const existingAdmin = await User.getUserByEmail(adminData.email);
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Name:', `${existingAdmin.first_name} ${existingAdmin.last_name}`);
            console.log('🔑 Role:', existingAdmin.role);
            console.log('\n🔄 Updating password to: Admin@2026!Secure\n');
            
            // Update the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminData.password, salt);
            
            await mongoose.model('User').findByIdAndUpdate(existingAdmin._id, {
                password: hashedPassword,
                isEmailVerified: true,
                emailVerifiedAt: new Date()
            });
            
            console.log('✅ Admin password updated successfully!\n');
        } else {
            // Create new admin user
            const admin = await User.createUser(adminData);
            
            console.log('✅ Admin user created successfully!\n');
            console.log('📋 Admin User Details:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

        // Display credentials
        console.log('📧 Email:    admin@sportsamigo.com');
        console.log('🔑 Password: Admin@2026!Secure');
        console.log('👤 Role:     admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('📝 How to Access Admin Dashboard:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Frontend URL: http://localhost:3000/login');
        console.log('2. Select "Admin" as role');
        console.log('3. Enter credentials above');
        console.log('4. You will be redirected to Admin Dashboard\n');
        
        console.log('🔐 Security Notes:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✓ Auto-admin session creation has been REMOVED');
        console.log('✓ Direct login bypass routes have been REMOVED');
        console.log('✓ Proper authentication middleware is now enforced');
        console.log('✓ All admin routes require valid session\n');

        mongoose.connection.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}

// Run the function
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   SportsAmigo - Admin User Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

createAdminUser();
