// A simplified script to fix deactivation reasons for users
require('dotenv').config();
const mongoose = require('mongoose');

// Get MongoDB URI from environment or use default - using the correct database name
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';
console.log('Using database URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));

// Define the UserStatus enum to match what's in the app
const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Define proper User schema matching the application
    const UserSchema = new mongoose.Schema({
      firstName: {
        type: String,
        required: [true, 'Please provide your first name'],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, 'Please provide your last name'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
        required: [true, 'Please provide a password'],
        select: false,
      },
      militaryId: {
        type: String,
        required: [true, 'Please provide your military ID'],
        trim: true,
      },
      role: {
        type: String,
        default: 'staff',
      },
      status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.PENDING,
      },
      deactivationReason: {
        type: String,
        required: false,
      },
      rank: String,
      company: String,
      lastLogin: Date,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      }
    }, { 
      timestamps: true,
      // Important: Don't enforce strict schema as we're just reading/updating data
      strict: false
    });
    
    // Use existing model if available or create a new one
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // Find all inactive users
    const inactiveUsers = await User.find({ status: UserStatus.INACTIVE });
    console.log(`\nFound ${inactiveUsers.length} inactive users`);
    
    if (inactiveUsers.length > 0) {
      // Show examples of inactive users
      console.log('\nSample inactive users:');
      inactiveUsers.slice(0, 3).forEach(user => {
        console.log(`- ${user.firstName || ''} ${user.lastName || ''} (${user.email || 'No email'})`);
        console.log(`  Status: ${user.status}, Reason: ${user.deactivationReason || 'None'}`);
      });
      
      // Count users without deactivation reason
      // More carefully check for null, undefined, or empty strings
      const usersWithoutReason = inactiveUsers.filter(user => {
        return user.deactivationReason === null || 
               user.deactivationReason === undefined || 
               user.deactivationReason === "";
      });
      
      console.log(`\n${usersWithoutReason.length} users don't have a deactivation reason`);
      
      if (usersWithoutReason.length > 0) {
        // Update users without deactivation reason
        console.log('\nUpdating users without deactivation reason...');
        
        for (const user of usersWithoutReason) {
          console.log(`- Updating ${user.firstName || ''} ${user.lastName || ''} (${user.email})...`);
          
          // Explicitly set the deactivation reason
          user.deactivationReason = 'Account deactivated by administrator';
          
          try {
            await User.updateOne(
              { _id: user._id },
              { $set: { deactivationReason: 'Account deactivated by administrator' } }
            );
            console.log(`  ✓ Successfully updated via updateOne`);
          } catch (updateError) {
            console.error(`  ✗ Error updating user via updateOne:`, updateError.message);
            
            try {
              // Fallback to save method if updateOne fails
              await user.save();
              console.log(`  ✓ Successfully updated via save method`);
            } catch (saveError) {
              console.error(`  ✗ Error saving user:`, saveError.message);
            }
          }
        }
        
        // Verify the updates
        console.log('\nVerifying updates...');
        const updatedUsers = await User.find({
          _id: { $in: usersWithoutReason.map(u => u._id) }
        });
        
        updatedUsers.forEach(user => {
          console.log(`- ${user.firstName || ''} ${user.lastName || ''}: ${user.deactivationReason || 'Still no reason'}`);
        });
      }
    } else {
      console.log('No inactive users found to update');
    }
    
    console.log('\nOperation completed');
  } catch (error) {
    console.error('Error processing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
}); 