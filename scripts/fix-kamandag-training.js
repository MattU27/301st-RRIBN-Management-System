/**
 * Script to fix the KAMANDAG training registration discrepancy
 * 
 * This script:
 * 1. Finds the KAMANDAG training record
 * 2. Cleans up its attendees list by removing duplicates and invalid entries
 * 3. Updates the registered count to match the actual number of valid attendees
 * 
 * Run with: node scripts/fix-kamandag-training.js
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

// Fix KAMANDAG training in local JSON file
function fixLocalKamandagTraining() {
  try {
    console.log('Loading trainings data from local JSON...');
    const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
    console.log(`Loaded ${trainingsData.length} training records`);
    
    // Find the KAMANDAG training
    const kamandagIndex = trainingsData.findIndex(t => 
      t.title && t.title.includes('KAMANDAG')
    );
    
    if (kamandagIndex === -1) {
      console.log('KAMANDAG training not found in the data');
      return;
    }
    
    const kamandagTraining = trainingsData[kamandagIndex];
    console.log(`Found KAMANDAG training: "${kamandagTraining.title}"`);
    console.log(`Current registered count: ${kamandagTraining.registered || 0}`);
    
    if (!kamandagTraining.attendees || kamandagTraining.attendees.length === 0) {
      console.log('No attendees found in the training record.');
      return;
    }
    
    console.log(`Total attendees array length: ${kamandagTraining.attendees.length}`);
    
    // Keep track of unique userIds to eliminate duplicates
    const seenUserIds = new Set();
    const validAttendees = [];
    const removedAttendees = [];
    
    // Process each attendee
    kamandagTraining.attendees.forEach((attendee, index) => {
      const userId = attendee.userId?.$oid || attendee.userId;
      console.log(`Processing attendee #${index + 1} (userId: ${userId || 'MISSING'})`);
      
      // Check if this is a valid attendee
      const isValidStatus = !attendee.status || 
                           attendee.status === 'registered' || 
                           attendee.status === 'attended' || 
                           attendee.status === 'completed';
      
      const hasValidUserData = attendee.userData && 
                              (attendee.userData.firstName || attendee.userData.lastName || 
                               attendee.userData.fullName);
      
      // Skip if missing userId, has invalid status, is a duplicate, or has no user data
      if (!userId || !isValidStatus || seenUserIds.has(userId) || !hasValidUserData) {
        let reason = '';
        if (!userId) reason = 'missing userId';
        else if (!isValidStatus) reason = `invalid status: ${attendee.status}`;
        else if (seenUserIds.has(userId)) reason = 'duplicate userId';
        else if (!hasValidUserData) reason = 'missing user data';
        
        console.log(`  - REMOVING: ${reason}`);
        removedAttendees.push({ index, reason, attendee });
        return;
      }
      
      // This is a valid attendee, add it to our list
      seenUserIds.add(userId);
      validAttendees.push(attendee);
      console.log(`  - KEEPING: userId ${userId}`);
    });
    
    console.log(`\nResults:`);
    console.log(`- Original attendees: ${kamandagTraining.attendees.length}`);
    console.log(`- Valid attendees: ${validAttendees.length}`);
    console.log(`- Removed attendees: ${removedAttendees.length}`);
    
    // Update the training with the valid attendees
    const updatedTraining = {
      ...kamandagTraining,
      attendees: validAttendees,
      registered: validAttendees.length
    };
    
    // Update the training in the array
    trainingsData[kamandagIndex] = updatedTraining;
    
    // Save the updated data
    fs.writeFileSync(TRAININGS_FILE, JSON.stringify(trainingsData, null, 2));
    
    console.log(`\nKAMANDAG training updated successfully:`);
    console.log(`- Registered count set to: ${validAttendees.length}`);
    console.log(`- All invalid or duplicate attendees removed`);
    
  } catch (error) {
    console.error('Error fixing KAMANDAG training:', error);
    process.exit(1);
  }
}

// Fix KAMANDAG training in MongoDB
async function fixMongoDBKamandagTraining() {
  try {
    // Define the schema only if it's not already defined
    if (!mongoose.models.Training) {
      const TrainingSchema = new mongoose.Schema({
        title: String,
        attendees: Array,
        registered: Number
      });
      mongoose.model('Training', TrainingSchema);
    }
    
    const Training = mongoose.model('Training');
    
    // Find the KAMANDAG training
    const kamandagTraining = await Training.findOne({ 
      title: { $regex: 'KAMANDAG', $options: 'i' } 
    });
    
    if (!kamandagTraining) {
      console.log('KAMANDAG training not found in the database');
      return;
    }
    
    console.log(`Found KAMANDAG training: "${kamandagTraining.title}"`);
    console.log(`Current registered count: ${kamandagTraining.registered || 0}`);
    
    if (!kamandagTraining.attendees || kamandagTraining.attendees.length === 0) {
      console.log('No attendees found in the training record.');
      return;
    }
    
    console.log(`Total attendees array length: ${kamandagTraining.attendees.length}`);
    
    // Keep track of unique userIds to eliminate duplicates
    const seenUserIds = new Set();
    const validAttendees = [];
    const removedAttendees = [];
    
    // Process each attendee
    kamandagTraining.attendees.forEach((attendee, index) => {
      const userId = attendee.userId?.toString();
      console.log(`Processing attendee #${index + 1} (userId: ${userId || 'MISSING'})`);
      
      // Check if this is a valid attendee
      const isValidStatus = !attendee.status || 
                           attendee.status === 'registered' || 
                           attendee.status === 'attended' || 
                           attendee.status === 'completed';
      
      const hasValidUserData = attendee.userData && 
                              (attendee.userData.firstName || attendee.userData.lastName || 
                               attendee.userData.fullName);
      
      // Skip if missing userId, has invalid status, is a duplicate, or has no user data
      if (!userId || !isValidStatus || seenUserIds.has(userId) || !hasValidUserData) {
        let reason = '';
        if (!userId) reason = 'missing userId';
        else if (!isValidStatus) reason = `invalid status: ${attendee.status}`;
        else if (seenUserIds.has(userId)) reason = 'duplicate userId';
        else if (!hasValidUserData) reason = 'missing user data';
        
        console.log(`  - REMOVING: ${reason}`);
        removedAttendees.push({ index, reason });
        return;
      }
      
      // This is a valid attendee, add it to our list
      seenUserIds.add(userId);
      validAttendees.push(attendee);
      console.log(`  - KEEPING: userId ${userId}`);
    });
    
    console.log(`\nResults:`);
    console.log(`- Original attendees: ${kamandagTraining.attendees.length}`);
    console.log(`- Valid attendees: ${validAttendees.length}`);
    console.log(`- Removed attendees: ${removedAttendees.length}`);
    
    // Update the training with the valid attendees
    kamandagTraining.attendees = validAttendees;
    kamandagTraining.registered = validAttendees.length;
    
    // Save the updated training
    await kamandagTraining.save();
    
    console.log(`\nKAMANDAG training updated successfully:`);
    console.log(`- Registered count set to: ${validAttendees.length}`);
    console.log(`- All invalid or duplicate attendees removed`);
    
  } catch (error) {
    console.error('Error fixing KAMANDAG training in MongoDB:', error);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log('=== KAMANDAG Training Fix Tool ===');
  
  if (USE_MONGODB) {
    console.log('Using MongoDB database');
    await connectToMongoDB();
    await fixMongoDBKamandagTraining();
    
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } else {
    console.log('Using local JSON files');
    fixLocalKamandagTraining();
  }
  
  console.log('Script completed successfully!');
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 