/**
 * Script to update the KAMANDAG training's registration display
 * 
 * This script:
 * 1. Finds the KAMANDAG training record
 * 2. Gets the accurate registration count from training_registrations.json
 * 3. Updates the training's registered count directly in the training record
 * 
 * Run with: node scripts/update-kamandag-display.js
 */

const fs = require('fs');
const path = require('path');

// Path to data files
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');
const REGISTRATIONS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.training_registrations.json');

try {
  console.log('=== Updating KAMANDAG Training Registration Display ===');
  
  // Check if registration file exists
  if (!fs.existsSync(REGISTRATIONS_FILE)) {
    console.error('Registration file does not exist!');
    process.exit(1);
  }
  
  // Load data
  console.log('Loading data files...');
  const trainings = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
  const registrations = JSON.parse(fs.readFileSync(REGISTRATIONS_FILE, 'utf8'));
  
  console.log(`Loaded ${trainings.length} trainings and ${registrations.length} registrations`);
  
  // Find KAMANDAG training
  const kamandagIndex = trainings.findIndex(t => 
    t.title && t.title.includes('KAMANDAG')
  );
  
  if (kamandagIndex === -1) {
    console.error('KAMANDAG training not found!');
    process.exit(1);
  }
  
  const kamandagTraining = trainings[kamandagIndex];
  console.log(`Found KAMANDAG training: "${kamandagTraining.title}"`);
  console.log(`Current registered count: ${kamandagTraining.registered || 0}`);
  
  // Get the training ID
  const trainingId = kamandagTraining._id.$oid || kamandagTraining._id;
  
  // Find registrations for this training
  const trainingRegistrations = registrations.filter(r => {
    const regTrainingId = r.trainingId.$oid || r.trainingId;
    return regTrainingId === trainingId;
  });
  
  console.log(`Found ${trainingRegistrations.length} registrations for KAMANDAG training`);
  
  // Check if count is already correct
  if (kamandagTraining.registered === trainingRegistrations.length) {
    console.log('Registration count is already correct!');
    process.exit(0);
  }
  
  // Update the training record
  trainings[kamandagIndex] = {
    ...kamandagTraining,
    registered: trainingRegistrations.length
  };
  
  // Write updated data
  fs.writeFileSync(TRAININGS_FILE, JSON.stringify(trainings, null, 2));
  
  console.log(`Updated KAMANDAG training registered count from ${kamandagTraining.registered} to ${trainingRegistrations.length}`);
  console.log('Registration display updated successfully!');
  
} catch (error) {
  console.error('Error updating KAMANDAG training:', error);
  process.exit(1);
} 