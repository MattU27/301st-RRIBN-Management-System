// A verification script to check all inactive users and their deactivation reasons
require('dotenv').config();
const mongoose = require('mongoose');

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';
console.log('Using database URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));

// Define UserStatus enum
const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
};

async function verifyDeactivationReasons() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define a simple User schema
    const UserSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      status: String,
      deactivationReason: String
    }, { 
      strict: false // Allow flexible schema matching
    });

    // Get the User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Find all users
    const allUsers = await User.find();
    const totalUsers = allUsers.length;
    
    // Count users by status
    const activeUsers = allUsers.filter(u => u.status === UserStatus.ACTIVE).length;
    const inactiveUsers = allUsers.filter(u => u.status === UserStatus.INACTIVE).length;
    const pendingUsers = allUsers.filter(u => u.status === UserStatus.PENDING).length;
    const otherStatusUsers = totalUsers - activeUsers - inactiveUsers - pendingUsers;

    console.log('\nUSER STATUS SUMMARY:');
    console.log('====================');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Active users: ${activeUsers}`);
    console.log(`Inactive users: ${inactiveUsers}`);
    console.log(`Pending users: ${pendingUsers}`);
    if (otherStatusUsers > 0) {
      console.log(`Users with other statuses: ${otherStatusUsers}`);
    }

    // Check inactive users for deactivation reasons
    const inactiveUsersList = allUsers.filter(u => u.status === UserStatus.INACTIVE);
    
    if (inactiveUsersList.length > 0) {
      console.log('\nINACTIVE USERS:');
      console.log('==============');
      
      // Count users with and without deactivation reasons
      const usersWithReason = inactiveUsersList.filter(u => 
        u.deactivationReason !== null && 
        u.deactivationReason !== undefined && 
        u.deactivationReason !== '');
      
      const usersWithoutReason = inactiveUsersList.filter(u => 
        u.deactivationReason === null || 
        u.deactivationReason === undefined || 
        u.deactivationReason === '');
      
      console.log(`Inactive users with a deactivation reason: ${usersWithReason.length}`);
      console.log(`Inactive users WITHOUT a deactivation reason: ${usersWithoutReason.length}`);
      
      // List all inactive users with their deactivation reasons
      console.log('\nDETAILED LIST:');
      inactiveUsersList.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Deactivation Reason: ${user.deactivationReason || 'NO REASON PROVIDED'}`);
        console.log(`   Has Reason: ${Boolean(user.deactivationReason)}`);
        console.log(`   Reason Type: ${typeof user.deactivationReason}`);
      });
      
      // Print recommendations
      if (usersWithoutReason.length > 0) {
        console.log('\nRECOMMENDATION:');
        console.log('==============');
        console.log('There are still inactive users without deactivation reasons.');
        console.log('Run the fix-deactivation-reasons.js script to update them.');
      } else {
        console.log('\nAll inactive users have deactivation reasons. No action needed.');
      }
    } else {
      console.log('\nNo inactive users found in the database.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the verification
verifyDeactivationReasons(); 