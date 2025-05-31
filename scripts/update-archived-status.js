/**
 * This script updates all deactivated users to have isArchived=true
 * Run this script once to migrate existing deactivated users to the archive
 */

// Import mongoose and dotenv
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  require('dotenv').config({ path: envPath });
} else {
  console.log('No .env.local file found, using default values');
  require('dotenv').config();
}

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';
console.log(`Using MongoDB URI: ${MONGODB_URI}`);

// Define user status enum to match what's in the app
const UserStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'deactivated', // Changed from 'inactive' to 'deactivated'
  RETIRED: 'retired',
  STANDBY: 'standby',
  READY: 'ready'
};

async function updateArchivedStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully to MongoDB');

    // Define a simple User schema
    const UserSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      status: String,
      isArchived: Boolean,
      deactivationReason: String
    }, { 
      strict: false // Allow flexible schema matching
    });

    // Get the User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    console.log('Checking for all users with status:', UserStatus.INACTIVE);
    
    // First, get all deactivated users regardless of archive status
    const allDeactivatedUsers = await User.find({ status: UserStatus.INACTIVE });
    console.log(`Total deactivated users: ${allDeactivatedUsers.length}`);
    
    if (allDeactivatedUsers.length === 0) {
      console.log('No deactivated users found in the database.');
      await mongoose.disconnect();
      return;
    }

    // Find all deactivated users that don't have isArchived set to true
    const deactivatedUsers = await User.find({ 
      status: UserStatus.INACTIVE,
      $or: [
        { isArchived: { $exists: false } },
        { isArchived: false }
      ]
    });

    console.log(`Found ${deactivatedUsers.length} deactivated users that are not archived`);

    if (deactivatedUsers.length === 0) {
      console.log('No users to update. All deactivated users are already archived.');
      
      // Check for any archived users anyway
      const existingArchived = await User.find({ isArchived: true });
      console.log(`There are currently ${existingArchived.length} archived users in the database`);
      
      await mongoose.disconnect();
      return;
    }

    // Update each user
    let updatedCount = 0;
    for (const user of deactivatedUsers) {
      console.log(`Processing user: ${user._id} (${user.firstName} ${user.lastName})`);
      user.isArchived = true;
      await user.save();
      updatedCount++;
      console.log(`✓ Updated user ${user._id} - marked as archived`);
    }

    console.log(`Successfully updated ${updatedCount} users to be archived`);
    
    // Find all archived users to verify
    const archivedUsers = await User.find({ isArchived: true });
    console.log(`Total archived users after update: ${archivedUsers.length}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating users:', error);
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error('Error disconnecting from MongoDB:', e);
    }
  }
}

// Run the function
updateArchivedStatus(); 