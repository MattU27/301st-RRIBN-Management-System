/**
 * Script to synchronize training registrations between old and new data models
 * 
 * This script:
 * 1. Migrates data from Training.attendees array to the new TrainingRegistration collection
 * 2. Updates the 'registered' count field in each Training document
 * 3. Creates a JSON export of registrations for the local database
 * 
 * Run with: node scripts/sync-registrations.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Path to data files for local mode
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');
const REGISTRATIONS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.training_registrations.json');

// Determine if using MongoDB or local JSON files
const USE_MONGODB = process.env.MONGODB_URI && !process.env.USE_LOCAL_JSON;

// MongoDB setup
async function connectToMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Load MongoDB models
async function loadModels() {
  try {
    // Define the schemas only if they're not already defined
    if (!mongoose.models.Training) {
      // Simple Training schema for this script
      const TrainingSchema = new mongoose.Schema({
        title: String,
        attendees: Array,
        registered: Number
      });
      mongoose.model('Training', TrainingSchema);
    }
    
    if (!mongoose.models.TrainingRegistration) {
      // TrainingRegistration schema
      const TrainingRegistrationSchema = new mongoose.Schema({
        trainingId: mongoose.Schema.Types.ObjectId,
        userId: mongoose.Schema.Types.ObjectId,
        status: String,
        registrationDate: Date,
        userData: Object
      });
      
      // Create a compound index to ensure unique registrations
      TrainingRegistrationSchema.index({ trainingId: 1, userId: 1 }, { unique: true });
      
      mongoose.model('TrainingRegistration', TrainingRegistrationSchema);
    }
    
    return {
      Training: mongoose.model('Training'),
      TrainingRegistration: mongoose.model('TrainingRegistration')
    };
  } catch (error) {
    console.error('Error loading models:', error);
    process.exit(1);
  }
}

// Sync MongoDB data
async function syncMongoDBRegistrations() {
  try {
    const { Training, TrainingRegistration } = await loadModels();
    
    // Get all trainings
    const trainings = await Training.find({});
    console.log(`Found ${trainings.length} training records in MongoDB`);
    
    // Process each training
    let totalRegistrations = 0;
    let updatedTrainings = 0;
    
    for (const training of trainings) {
      console.log(`\nProcessing training: ${training.title}`);
      const trainingId = training._id;
      
      // Skip trainings with no attendees
      if (!training.attendees || !Array.isArray(training.attendees) || training.attendees.length === 0) {
        console.log(`No attendees found for this training, skipping`);
        continue;
      }
      
      // Track valid registrations
      const validRegistrations = [];
      
      // Process each attendee
      for (const attendee of training.attendees) {
        // Skip invalid attendees
        if (!attendee.userId) {
          console.log(`Skipping attendee with missing userId`);
          continue;
        }
        
        // Normalize the user ID
        const userId = typeof attendee.userId === 'object' ? 
          attendee.userId.toString() : attendee.userId;
        
        // Check if status is valid
        const status = attendee.status || 'registered';
        const isValidStatus = ['registered', 'attended', 'completed', 'absent', 'excused'].includes(status);
        
        if (!isValidStatus) {
          console.log(`Skipping attendee with invalid status: ${status}`);
          continue;
        }
        
        // Create or update registration
        try {
          const registrationData = {
            trainingId,
            userId: new mongoose.Types.ObjectId(userId),
            status,
            registrationDate: attendee.registrationDate || new Date(),
            userData: attendee.userData || {}
          };
          
          // Use updateOne with upsert to handle duplicate entries
          await TrainingRegistration.updateOne(
            { trainingId, userId: registrationData.userId },
            registrationData,
            { upsert: true }
          );
          
          validRegistrations.push(registrationData);
          console.log(`Processed registration for user ${userId}`);
        } catch (err) {
          console.error(`Error processing registration:`, err.message);
        }
      }
      
      // Update the training's registered count
      const registrationCount = validRegistrations.length;
      if (training.registered !== registrationCount) {
        training.registered = registrationCount;
        await training.save();
        updatedTrainings++;
        console.log(`Updated training registered count to ${registrationCount}`);
      }
      
      totalRegistrations += registrationCount;
    }
    
    console.log(`\nMigration Summary:`);
    console.log(`- Total trainings processed: ${trainings.length}`);
    console.log(`- Total trainings updated: ${updatedTrainings}`);
    console.log(`- Total registrations migrated: ${totalRegistrations}`);
    
    // Verify the migration
    const actualRegistrations = await TrainingRegistration.countDocuments();
    console.log(`- Registration records in database: ${actualRegistrations}`);
    
  } catch (error) {
    console.error('Error syncing MongoDB registrations:', error);
    process.exit(1);
  }
}

// Sync local JSON files
async function syncLocalJSONRegistrations() {
  try {
    console.log('Loading trainings data from local JSON...');
    const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
    console.log(`Loaded ${trainingsData.length} training records`);
    
    // Create registrations array
    const registrations = [];
    let totalRegistrations = 0;
    let updatedTrainings = 0;
    
    // Process each training
    const updatedTrainingsData = trainingsData.map(training => {
      console.log(`\nProcessing training: ${training.title}`);
      
      // Skip trainings with no attendees
      if (!training.attendees || !Array.isArray(training.attendees) || training.attendees.length === 0) {
        console.log(`No attendees found for this training, skipping`);
        return training;
      }
      
      // Extract valid attendees
      const validAttendees = [];
      
      // Keep track of unique userIds
      const seenUserIds = new Set();
      
      // Process each attendee
      for (const attendee of training.attendees) {
        // Skip invalid attendees
        if (!attendee.userId) {
          console.log(`Skipping attendee with missing userId`);
          continue;
        }
        
        // Get the userId
        const userId = attendee.userId.$oid || attendee.userId;
        
        // Skip duplicates
        if (seenUserIds.has(userId)) {
          console.log(`Skipping duplicate attendee with userId: ${userId}`);
          continue;
        }
        
        // Check if status is valid
        const status = attendee.status || 'registered';
        const isValidStatus = ['registered', 'attended', 'completed', 'absent', 'excused'].includes(status);
        
        if (!isValidStatus) {
          console.log(`Skipping attendee with invalid status: ${status}`);
          continue;
        }
        
        // Add to seen userIds
        seenUserIds.add(userId);
        
        // Add to valid attendees
        validAttendees.push(attendee);
        
        // Create registration record
        const registration = {
          trainingId: training._id.$oid || training._id,
          userId,
          status,
          registrationDate: attendee.registrationDate || new Date(),
          userData: attendee.userData || {}
        };
        
        // Add to registrations array
        registrations.push(registration);
        totalRegistrations++;
        
        console.log(`Processed registration for user ${userId}`);
      }
      
      // Check if registered count needs updating
      if (training.registered !== validAttendees.length) {
        console.log(`Updating training registered count from ${training.registered} to ${validAttendees.length}`);
        updatedTrainings++;
        return {
          ...training,
          registered: validAttendees.length,
          attendees: validAttendees
        };
      }
      
      return {
        ...training,
        attendees: validAttendees
      };
    });
    
    // Save updated trainings
    fs.writeFileSync(TRAININGS_FILE, JSON.stringify(updatedTrainingsData, null, 2));
    console.log(`Updated trainings data saved to ${TRAININGS_FILE}`);
    
    // Save registrations to file
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(registrations, null, 2));
    console.log(`Registrations data saved to ${REGISTRATIONS_FILE}`);
    
    console.log(`\nMigration Summary:`);
    console.log(`- Total trainings processed: ${trainingsData.length}`);
    console.log(`- Total trainings updated: ${updatedTrainings}`);
    console.log(`- Total registrations migrated: ${totalRegistrations}`);
    
  } catch (error) {
    console.error('Error syncing local JSON registrations:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('=== Training Registration Synchronization Tool ===');
  
  if (USE_MONGODB) {
    console.log('Using MongoDB database');
    await connectToMongoDB();
    await syncMongoDBRegistrations();
    
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } else {
    console.log('Using local JSON files');
    await syncLocalJSONRegistrations();
  }
  
  console.log('Script completed successfully!');
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 