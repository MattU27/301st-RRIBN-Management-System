// Script to create a test inactive user with a missing deactivation reason
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // We'll need this for password hashing

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';
console.log('Using database URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));

// Define UserStatus enum
const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
};

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define User schema with minimal validation for testing
    const UserSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      militaryId: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        default: UserStatus.PENDING,
      },
      deactivationReason: String,
      role: {
        type: String,
        default: 'staff',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }, { 
      strict: false // Allow flexible schema matching
    });

    // Add password hashing pre-save hook
    UserSchema.pre('save', async function(next) {
      if (this.isModified('password')) {
        try {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        } catch (error) {
          return next(error);
        }
      }
      next();
    });

    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Create test user data
    const testUserData = {
      firstName: 'Test',
      lastName: 'InactiveUser',
      email: 'test.inactive2@example.com', // Using a different email
      password: 'Password123!',
      militaryId: 'TEST98765',
      role: 'staff',
      status: UserStatus.INACTIVE,
      // No deactivationReason set
    };

    console.log('Creating test inactive user with the following data:');
    console.log(JSON.stringify({
      ...testUserData,
      password: '[MASKED]'
    }, null, 2));

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: testUserData.email });
      
      if (existingUser) {
        console.log('User already exists - updating to inactive status');
        existingUser.status = UserStatus.INACTIVE;
        existingUser.deactivationReason = null; // Explicitly remove any reason
        await existingUser.save();
        console.log('Successfully updated user to inactive status without deactivation reason');
      } else {
        // Create new user
        const newUser = new User(testUserData);
        await newUser.save();
        console.log('Successfully created new inactive test user');
      }

      // Verify the user exists and has correct status
      const verifyUser = await User.findOne({ email: testUserData.email });
      console.log('\nVerified test user:');
      console.log(`Name: ${verifyUser.firstName} ${verifyUser.lastName}`);
      console.log(`Email: ${verifyUser.email}`);
      console.log(`Status: ${verifyUser.status}`);
      console.log(`Deactivation Reason: ${verifyUser.deactivationReason || 'None'}`);
      
    } catch (error) {
      console.error('Error creating/updating test user:', error);
      
      // If there's a validation error, show it in detail
      if (error.name === 'ValidationError') {
        Object.keys(error.errors).forEach(field => {
          console.error(`Validation error in field ${field}: ${error.errors[field].message}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
createTestUser(); 