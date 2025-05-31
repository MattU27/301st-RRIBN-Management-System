/**
 * Script to fix training attendee data in the JSON database files
 * 
 * This script:
 * 1. Loads the trainings and personnel data from JSON files
 * 2. For each training, updates attendee information with correct user data
 * 3. Saves the updated trainings data back to the JSON file
 * 
 * Run with: node scripts/fix-training-attendees.js
 */

const fs = require('fs');
const path = require('path');

// Path to data files
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');
const PERSONNEL_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.personnels.json');

// Load data from files
try {
  console.log('Loading trainings and personnel data...');
  
  const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
  const personnelData = JSON.parse(fs.readFileSync(PERSONNEL_FILE, 'utf8'));
  
  console.log(`Loaded ${trainingsData.length} training records and ${personnelData.length} personnel records`);
  
  // Create a map of personnel by ID for faster lookups
  const personnelMap = new Map();
  
  // First, index by _id.$oid
  personnelData.forEach(person => {
    if (person._id && person._id.$oid) {
      personnelMap.set(person._id.$oid, person);
    }
  });
  
  // Also index by email for alternative lookups
  personnelData.forEach(person => {
    if (person.email) {
      personnelMap.set(person.email, person);
    }
    
    // Add any extra indices that might help with lookups
    if (person.militaryId) {
      personnelMap.set(person.militaryId, person);
    }
    if (person.serviceId) {
      personnelMap.set(person.serviceId, person);
    }
  });
  
  console.log(`Created personnel map with ${personnelMap.size} entries`);
  
  // Keep track of stats
  let totalUpdatedTrainings = 0;
  let totalUpdatedAttendees = 0;
  let totalMissingPersonnel = 0;
  
  // Process each training record
  const updatedTrainingsData = trainingsData.map(training => {
    if (!training.attendees || training.attendees.length === 0) {
      return training; // Skip trainings with no attendees
    }
    
    let trainingUpdated = false;
    let trainingUpdatedAttendees = 0;
    let trainingMissingPersonnel = 0;
    
    // Update each attendee with correct user data
    const updatedAttendees = training.attendees.map(attendee => {
      // Try multiple lookup methods
      let personnel = null;
      
      // Method 1: Look up by userId.$oid
      if (!personnel && attendee.userId && attendee.userId.$oid) {
        personnel = personnelMap.get(attendee.userId.$oid);
      }
      
      // Method 2: Look up by email if available in userData
      if (!personnel && attendee.userData && attendee.userData.email) {
        personnel = personnelMap.get(attendee.userData.email);
      }
      
      // Method 3: Look up by militaryId or serviceId if available
      if (!personnel && attendee.userData) {
        if (attendee.userData.militaryId) {
          personnel = personnelMap.get(attendee.userData.militaryId);
        }
        if (!personnel && attendee.userData.serviceId) {
          personnel = personnelMap.get(attendee.userData.serviceId);
        }
      }
      
      // Method 4: Try to find by full name (last resort)
      if (!personnel && attendee.userData && attendee.userData.firstName && attendee.userData.lastName) {
        const fullName = `${attendee.userData.firstName} ${attendee.userData.lastName}`.toLowerCase();
        personnel = personnelData.find(p => 
          `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase() === fullName
        );
      }
      
      if (!personnel) {
        trainingMissingPersonnel++;
        
        // If we can't find the personnel but have userData, clean it up
        if (attendee.userData) {
          // Clean up any N/A or Unassigned values
          if (attendee.userData.rank === 'N/A') attendee.userData.rank = '';
          if (attendee.userData.company === 'Unassigned') attendee.userData.company = '';
          if (attendee.userData.fullName === 'N/A') {
            const firstName = attendee.userData.firstName || '';
            const lastName = attendee.userData.lastName || '';
            attendee.userData.fullName = `${firstName} ${lastName}`.trim() || '';
          }
          
          trainingUpdatedAttendees++;
          trainingUpdated = true;
        }
        
        return attendee;
      }
      
      // We found the personnel record, so update the attendee data
      const updatedUserData = {
        rank: personnel.rank || '',
        company: personnel.company || '',
        firstName: personnel.firstName || '',
        lastName: personnel.lastName || '',
        fullName: `${personnel.firstName || ''} ${personnel.lastName || ''}`.trim() || '',
        email: personnel.email || '',
        militaryId: personnel.militaryId || personnel.serviceId || '',
        serviceId: personnel.serviceId || personnel.militaryId || ''
      };
      
      // Check if any data has changed - we need to update if:
      // 1. userData doesn't exist, or
      // 2. any field has a placeholder value like N/A or Unassigned, or
      // 3. any actual field value is different from what we have now
      const needsUpdate = 
        !attendee.userData || 
        attendee.userData.rank === 'N/A' ||
        attendee.userData.company === 'Unassigned' ||
        attendee.userData.fullName === 'N/A' ||
        attendee.userData.rank !== updatedUserData.rank ||
        attendee.userData.company !== updatedUserData.company ||
        attendee.userData.firstName !== updatedUserData.firstName ||
        attendee.userData.lastName !== updatedUserData.lastName;
      
      if (needsUpdate) {
        trainingUpdatedAttendees++;
        trainingUpdated = true;
        
        return {
          ...attendee,
          userData: updatedUserData
        };
      }
      
      return attendee;
    });
    
    // Update our totals
    totalUpdatedAttendees += trainingUpdatedAttendees;
    totalMissingPersonnel += trainingMissingPersonnel;
    
    if (trainingUpdated) {
      totalUpdatedTrainings++;
      return {
        ...training,
        attendees: updatedAttendees
      };
    }
    
    return training;
  });
  
  // Save the updated trainings data back to the file
  fs.writeFileSync(TRAININGS_FILE, JSON.stringify(updatedTrainingsData, null, 2));
  
  console.log('\nTraining Attendees Update Summary:');
  console.log('--------------------------------');
  console.log(`Total training records: ${trainingsData.length}`);
  console.log(`Training records updated: ${totalUpdatedTrainings}`);
  console.log(`Attendee records updated: ${totalUpdatedAttendees}`);
  console.log(`Missing personnel references: ${totalMissingPersonnel}`);
  
  console.log('\nTraining attendee data updated successfully!');
  
} catch (error) {
  console.error('Error updating training attendees:', error);
  process.exit(1);
} 