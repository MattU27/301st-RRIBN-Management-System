// Script to fix deactivation reasons for inactive users
const mongoose = require('mongoose');
require('dotenv').config();

// Define MongoDB URI - use environment variable or add your connection string directly here
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_database';

// Display connection information safely
let uriDisplay;
try {
  const mongoUriParts = MONGODB_URI.split('@');
  uriDisplay = mongoUriParts.length > 1 
    ? `${mongoUriParts[0].split(':')[0]}:****@${mongoUriParts[1]}` 
    : MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
} catch (error) {
  uriDisplay = 'Invalid MongoDB URI format';
}
console.log('Connecting to MongoDB:', uriDisplay);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User schema based on actual database structure
// Note: The actual collection name may be different in your database
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  status: String,
  deactivationReason: String,
  // Add other fields that might be in your schema
  username: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
}, { 
  strict: false, // Allow flexible matching with the actual schema
  collection: 'users' // Specify your actual collection name here
});

const User = mongoose.model('User', userSchema);

async function inspectCollections() {
  try {
    // Get all collections to determine the actual user collection name
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
  } catch (error) {
    console.error('Error listing collections:', error);
  }
}

async function fixDeactivationReasons() {
  try {
    await inspectCollections();
    
    // Check database for user schema
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      console.log('Sample user structure:');
      console.log(JSON.stringify(sampleUser, null, 2));
    } else {
      console.log('No users found in collection. Please verify the collection name.');
      mongoose.connection.close();
      return;
    }

    // Find all inactive users
    const inactiveUsers = await User.find({ status: 'inactive' });
    console.log(`\nFound ${inactiveUsers.length} inactive users`);

    // Log all inactive users with their current deactivation reasons
    inactiveUsers.forEach(user => {
      console.log(`\nUser: ${user.firstName} ${user.lastName} (${user.email || user.username || 'No email/username'})`);
      console.log(`Status: ${user.status}`);
      console.log(`Deactivation Reason: ${user.deactivationReason || 'None'}`);
      console.log('-----------------------------------');
    });

    // Fix users with missing deactivation reasons
    const usersToFix = inactiveUsers.filter(user => !user.deactivationReason);
    console.log(`\nFound ${usersToFix.length} users with missing deactivation reasons`);

    if (usersToFix.length > 0) {
      for (const user of usersToFix) {
        // Update the user with a default reason
        const result = await User.updateOne(
          { _id: user._id },
          { $set: { deactivationReason: 'Account deactivated by administrator' } }
        );
        
        console.log(`Fixed user: ${user.firstName} ${user.lastName} - Update result:`, result);
      }
      console.log('All users with missing deactivation reasons have been fixed');
      
      // Verify the fixes
      const verifyUsers = await User.find({ _id: { $in: usersToFix.map(u => u._id) } });
      console.log('\nVerifying fixed users:');
      verifyUsers.forEach(user => {
        console.log(`User: ${user.firstName} ${user.lastName} - Deactivation Reason: ${user.deactivationReason || 'Still missing!'}`);
      });
    }

    console.log('\nOperation completed successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error fixing deactivation reasons:', error);
    mongoose.connection.close();
  }
}

fixDeactivationReasons(); 