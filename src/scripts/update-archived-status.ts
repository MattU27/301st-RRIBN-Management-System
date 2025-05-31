/**
 * This script updates all deactivated users to have isArchived=true
 * Run this script once to migrate existing deactivated users to the archive
 */

import { dbConnect } from '../utils/dbConnect';
import User from '../models/User';
import { UserStatus } from '../types/auth';

async function updateArchivedStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await dbConnect();
    console.log('Connected successfully to MongoDB');

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
      process.exit(0);
    }

    // Update each user
    let updatedCount = 0;
    for (const user of deactivatedUsers) {
      user.isArchived = true;
      await user.save();
      updatedCount++;
      console.log(`Updated user ${user._id} (${user.firstName} ${user.lastName}) - marked as archived`);
    }

    console.log(`Successfully updated ${updatedCount} users to be archived`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating users:', error);
    process.exit(1);
  }
}

// Run the function
updateArchivedStatus(); 