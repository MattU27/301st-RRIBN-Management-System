/**
 * Script to synchronize the 'registered' count field in training records
 * with the actual number of attendees in each training
 * 
 * This fixes any discrepancies between the displayed registration count
 * and actual registered attendees.
 * 
 * Run with: node scripts/sync-training-registered-counts.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Path to data files for local mode
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');

// Determine if using MongoDB or local JSON files
const USE_MONGODB = process.env.MONGODB_URI && !process.env.USE_LOCAL_JSON;

// MongoDB setup if needed
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

// Load Training model if using MongoDB
async function loadTrainingModel() {
  try {
    // Define the schema only if it's not already defined
    if (!mongoose.models.Training) {
      // Import statuses and types
      const TrainingStatus = {
        UPCOMING: 'upcoming',
        ONGOING: 'ongoing',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
      };

      // Define the Training schema (simplified version for this script)
      const TrainingSchema = new mongoose.Schema({
        title: String,
        attendees: [{ 
          userId: mongoose.Schema.Types.ObjectId,
          status: String,
          userData: Object
        }],
        registered: {
          type: Number,
          default: 0,
        }
      });

      // Create the model
      mongoose.model('Training', TrainingSchema);
    }
    
    return mongoose.model('Training');
  } catch (error) {
    console.error('Error loading Training model:', error);
    process.exit(1);
  }
}

// Sync MongoDB training records
async function syncMongoDBTrainings() {
  try {
    const Training = await loadTrainingModel();
    
    // Get all trainings
    const trainings = await Training.find({});
    console.log(`Found ${trainings.length} training records in MongoDB`);
    
    let updatedCount = 0;
    
    // Update each training
    for (const training of trainings) {
      // Count only valid attendees (with userId and valid status)
      const validAttendees = training.attendees ? training.attendees.filter(attendee => 
        attendee && attendee.userId && 
        (!attendee.status || attendee.status === 'registered' || 
         attendee.status === 'attended' || attendee.status === 'completed')
      ) : [];
      
      const attendeesCount = validAttendees.length;
      
      // Only update if count is different
      if (training.registered !== attendeesCount) {
        console.log(`Updating training "${training.title}": registered ${training.registered} -> ${attendeesCount}`);
        
        training.registered = attendeesCount;
        await training.save();
        updatedCount++;
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`Total training records: ${trainings.length}`);
    console.log(`Updated records: ${updatedCount}`);
    console.log('Training registration counts synchronized successfully!');
    
  } catch (error) {
    console.error('Error syncing MongoDB training records:', error);
    process.exit(1);
  }
}

// Sync local JSON training records
function syncLocalJSONTrainings() {
  try {
    console.log('Loading trainings data from local JSON...');
    const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
    console.log(`Loaded ${trainingsData.length} training records`);
    
    let updatedCount = 0;
    
    // Update each training
    const updatedTrainingsData = trainingsData.map(training => {
      // Debug logging
      console.log(`\nTraining: ${training.title}`);
      console.log(`Current registered count: ${training.registered || 0}`);
      console.log(`Total attendees array length: ${training.attendees ? training.attendees.length : 0}`);
      
      // More detailed logging for the KAMANDAG training
      if (training.title.includes('KAMANDAG')) {
        console.log('\n=== DETAILED ATTENDEES LIST FOR KAMANDAG TRAINING ===');
        console.log('Registered personnel should match the displayed count');
        
        if (training.attendees && training.attendees.length > 0) {
          console.log(`Total number of entries in attendees array: ${training.attendees.length}`);
          
          // Check for duplicate users
          const userIds = new Set();
          const duplicates = [];
          
          training.attendees.forEach((attendee, index) => {
            const userId = attendee.userId?.$oid || attendee.userId;
            if (userId) {
              if (userIds.has(userId)) {
                duplicates.push({ index, userId });
              } else {
                userIds.add(userId);
              }
            }
            
            // Print each attendee's basic info
            console.log(`\nAttendee #${index + 1}:`);
            console.log(`- userId: ${userId || 'MISSING'}`);
            console.log(`- status: ${attendee.status || 'NONE'}`);
            
            if (attendee.userData) {
              console.log(`- fullName: ${attendee.userData.fullName || 'EMPTY'}`);
              console.log(`- rank: ${attendee.userData.rank || 'EMPTY'}`);
              console.log(`- company: ${attendee.userData.company || 'EMPTY'}`);
            } else {
              console.log(`- userData: MISSING`);
            }
          });
          
          console.log(`\nUnique userIds: ${userIds.size}`);
          if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate entries!`);
            console.log('Duplicate entries:', duplicates);
          }
        } else {
          console.log('No attendees found in the training record.');
        }
        console.log('=== END DETAILED ATTENDEES LIST ===\n');
      }
      
      // Count only valid attendees (with userId and valid status)
      const validAttendees = training.attendees ? training.attendees.filter(attendee => {
        const isValid = attendee && attendee.userId && 
          (!attendee.status || attendee.status === 'registered' || 
           attendee.status === 'attended' || attendee.status === 'completed');
        
        if (!isValid && attendee) {
          console.log(`Invalid attendee: ${JSON.stringify(attendee, null, 2)}`);
        }
        
        return isValid;
      }) : [];
      
      const attendeesCount = validAttendees.length;
      console.log(`Valid attendees count: ${attendeesCount}`);
      
      // Skip if registered field is already correct
      if (training.registered === attendeesCount) {
        return training;
      }
      
      console.log(`Updating training "${training.title}": registered ${training.registered || 0} -> ${attendeesCount}`);
      updatedCount++;
      
      // Return updated training with correct registered count
      return {
        ...training,
        registered: attendeesCount
      };
    });
    
    // Save the updated data
    fs.writeFileSync(TRAININGS_FILE, JSON.stringify(updatedTrainingsData, null, 2));
    
    console.log(`\nSummary:`);
    console.log(`Total training records: ${trainingsData.length}`);
    console.log(`Updated records: ${updatedCount}`);
    console.log('Training registration counts synchronized successfully!');
    
  } catch (error) {
    console.error('Error syncing local training records:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('=== Training Registration Count Synchronization Tool ===');
  
  if (USE_MONGODB) {
    console.log('Using MongoDB database');
    await connectToMongoDB();
    await syncMongoDBTrainings();
    
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } else {
    console.log('Using local JSON files');
    syncLocalJSONTrainings();
  }
  
  console.log('Script completed successfully!');
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 