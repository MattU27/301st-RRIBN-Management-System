/**
 * Script to create a registration tracking table specifically for the KAMANDAG training
 * 
 * This script:
 * 1. Extracts valid attendees from the KAMANDAG training
 * 2. Creates registration records in a new training_registrations.json file
 * 3. Updates the registered count to match actual valid registrations
 * 
 * Run with: node scripts/create-registration-table.js
 */

const fs = require('fs');
const path = require('path');

// Path to data files
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');
const REGISTRATIONS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.training_registrations.json');

try {
  console.log('=== Creating Registration Table for KAMANDAG Training ===');
  
  // Load trainings data
  console.log('Loading trainings data...');
  const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
  console.log(`Loaded ${trainingsData.length} training records`);
  
  // Find KAMANDAG training
  const kamandagTraining = trainingsData.find(training => 
    training.title && training.title.includes('KAMANDAG')
  );
  
  if (!kamandagTraining) {
    console.error('KAMANDAG training not found');
    process.exit(1);
  }
  
  console.log(`Found KAMANDAG training: "${kamandagTraining.title}"`);
  console.log(`Current registered count: ${kamandagTraining.registered || 0}`);
  
  if (!kamandagTraining.attendees || kamandagTraining.attendees.length === 0) {
    console.log('No attendees found in the training record.');
    process.exit(1);
  }
  
  console.log(`Total attendees array length: ${kamandagTraining.attendees.length}`);
  
  // Process attendees into registration records
  const registrations = [];
  const validAttendees = [];
  const seenUserIds = new Set();
  
  kamandagTraining.attendees.forEach((attendee, index) => {
    if (!attendee || !attendee.userId) {
      console.log(`Skipping invalid attendee at index ${index}`);
      return;
    }
    
    // Get userId
    const userId = attendee.userId.$oid || attendee.userId;
    if (!userId) {
      console.log(`Skipping attendee with missing userId at index ${index}`);
      return;
    }
    
    // Skip duplicates
    if (seenUserIds.has(userId)) {
      console.log(`Skipping duplicate registration for user ${userId}`);
      return;
    }
    
    // Check if user data is valid
    const hasValidUserData = attendee.userData && 
      (attendee.userData.firstName || attendee.userData.lastName || 
       attendee.userData.fullName);
       
    if (!hasValidUserData) {
      console.log(`Skipping attendee with missing user data at index ${index}`);
      return;
    }
    
    // Add to seen userIds
    seenUserIds.add(userId);
    
    // Create registration record
    const registration = {
      _id: {
        $oid: Date.now().toString(16) + Math.floor(Math.random() * 16777215).toString(16)
      },
      trainingId: kamandagTraining._id,
      userId: {
        $oid: userId
      },
      status: attendee.status || 'registered',
      registrationDate: attendee.registrationDate || {
        $date: new Date().toISOString()
      },
      userData: attendee.userData
    };
    
    // Add to registrations array
    registrations.push(registration);
    validAttendees.push(attendee);
    
    console.log(`Created registration record for user ${userId}`);
  });
  
  // Check if we need to create a new file or append to existing
  let existingRegistrations = [];
  try {
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      console.log('Found existing registrations file, appending to it');
      existingRegistrations = JSON.parse(fs.readFileSync(REGISTRATIONS_FILE, 'utf8'));
    }
  } catch (error) {
    console.log('No existing registrations file found, creating new one');
  }
  
  // Combine existing and new registrations
  const allRegistrations = [...existingRegistrations, ...registrations];
  
  // Save registrations to file
  fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(allRegistrations, null, 2));
  console.log(`Saved ${registrations.length} registration records to ${REGISTRATIONS_FILE}`);
  
  // Update KAMANDAG training's registered count
  const updatedTrainingsData = trainingsData.map(training => {
    if (training.title === kamandagTraining.title) {
      return {
        ...training,
        registered: validAttendees.length,
        attendees: validAttendees
      };
    }
    return training;
  });
  
  // Save updated trainings
  fs.writeFileSync(TRAININGS_FILE, JSON.stringify(updatedTrainingsData, null, 2));
  console.log(`Updated KAMANDAG training registered count to ${validAttendees.length}`);
  
  console.log('Registration table creation completed successfully!');
  
} catch (error) {
  console.error('Error creating registration table:', error);
  process.exit(1);
} 