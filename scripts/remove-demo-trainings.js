/**
 * Script to remove all demo/seed trainings from the database
 * 
 * This script:
 * 1. Removes all trainings from the original demo/seed script
 * 2. Cleans up related registration records
 * 
 * Run with: node scripts/remove-demo-trainings.js
 */

const fs = require('fs');
const path = require('path');

// Path to data files
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');
const REGISTRATIONS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.training_registrations.json');

// List of training titles from the demo script
const DEMO_TRAINING_TITLES = [
  'Basic Combat Training',
  'Staff Officer Development Course',
  'Medical First Response',
  'Cyber Defense and Information Security Workshop',
  'KAMANDAG 2023 Joint Military Exercise',
  'Urban Warfare and Close Quarter Battle',
  'Command and General Staff Course'
];

try {
  console.log('=== Removing Demo Training Records ===');
  
  // Load data files
  console.log('Loading data files...');
  console.log(`Trainings file path: ${TRAININGS_FILE}`);
  console.log(`Registrations file path: ${REGISTRATIONS_FILE}`);
  
  let trainings = [];
  let registrations = [];
  
  // Check if files exist
  if (fs.existsSync(TRAININGS_FILE)) {
    const fileContent = fs.readFileSync(TRAININGS_FILE, 'utf8');
    console.log(`Trainings file size: ${fileContent.length} bytes`);
    
    try {
      trainings = JSON.parse(fileContent);
      console.log(`Loaded ${trainings.length} training records`);
    } catch (parseError) {
      console.error(`Error parsing trainings file: ${parseError.message}`);
      console.log('First 100 characters of file:', fileContent.substring(0, 100));
    }
  } else {
    console.log('No trainings file found at path:', TRAININGS_FILE);
    // Create empty file if it doesn't exist
    fs.writeFileSync(TRAININGS_FILE, '[]');
    console.log('Created empty trainings file');
    trainings = [];
  }
  
  if (fs.existsSync(REGISTRATIONS_FILE)) {
    const fileContent = fs.readFileSync(REGISTRATIONS_FILE, 'utf8');
    console.log(`Registrations file size: ${fileContent.length} bytes`);
    
    try {
      registrations = JSON.parse(fileContent);
      console.log(`Loaded ${registrations.length} registration records`);
    } catch (parseError) {
      console.error(`Error parsing registrations file: ${parseError.message}`);
      console.log('First 100 characters of file:', fileContent.substring(0, 100));
    }
  } else {
    console.log('No registrations file found at path:', REGISTRATIONS_FILE);
    // Create empty file if it doesn't exist
    fs.writeFileSync(REGISTRATIONS_FILE, '[]');
    console.log('Created empty registrations file');
    registrations = [];
  }
  
  // Find the demo trainings to remove
  const trainingIdsToRemove = [];
  const trainingsToKeep = [];
  
  if (trainings.length > 0) {
    console.log('\nSearching for demo trainings to remove...');
    for (const training of trainings) {
      if (!training.title) {
        console.log('Found training without title:', JSON.stringify(training).substring(0, 100) + '...');
        continue;
      }
      
      if (DEMO_TRAINING_TITLES.includes(training.title)) {
        const trainingId = training._id?.$oid || training._id;
        trainingIdsToRemove.push(trainingId);
        console.log(`Found demo training to remove: "${training.title}" (ID: ${trainingId})`);
      } else {
        trainingsToKeep.push(training);
        console.log(`Keeping training: "${training.title}"`);
      }
    }
    
    console.log(`\nRemoving ${trainingIdsToRemove.length} demo trainings, keeping ${trainingsToKeep.length} trainings`);
  } else {
    console.log('No trainings found to process');
  }
  
  // Filter out related registrations
  if (registrations.length > 0 && trainingIdsToRemove.length > 0) {
    console.log('\nRemoving related registration records...');
    const registrationsToKeep = registrations.filter(registration => {
      if (!registration.trainingId) {
        console.log('Found registration without trainingId:', JSON.stringify(registration).substring(0, 100) + '...');
        return true; // Keep it since we can't determine if it's related
      }
      
      const regTrainingId = registration.trainingId?.$oid || registration.trainingId;
      const shouldKeep = !trainingIdsToRemove.includes(regTrainingId);
      
      if (!shouldKeep) {
        console.log(`Removing registration for training ID: ${regTrainingId}`);
      }
      
      return shouldKeep;
    });
    
    const removedRegistrations = registrations.length - registrationsToKeep.length;
    console.log(`Removing ${removedRegistrations} related registration records`);
    
    // Save updated registrations
    if (registrationsToKeep.length !== registrations.length) {
      fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(registrationsToKeep, null, 2));
      console.log(`Updated registrations file saved (${registrationsToKeep.length} records)`);
    } else {
      console.log('No registration records needed to be removed');
    }
  } else {
    console.log('No registration records to process or no trainings to remove');
  }
  
  // Save updated trainings
  if (trainingsToKeep.length !== trainings.length) {
    fs.writeFileSync(TRAININGS_FILE, JSON.stringify(trainingsToKeep, null, 2));
    console.log(`Updated trainings file saved (${trainingsToKeep.length} records)`);
  } else {
    console.log('No training records needed to be removed');
  }
  
  console.log('\nCleanup completed successfully!');
  
} catch (error) {
  console.error('Error removing demo trainings:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} 