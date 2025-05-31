/**
 * Script to fix missing names in training attendee data
 * 
 * This script:
 * 1. Loads the trainings JSON file
 * 2. For each attendee, extracts the name from the email address if name is missing
 * 3. Updates the trainings data
 * 
 * Run with: node scripts/fix-training-names.js
 */

const fs = require('fs');
const path = require('path');

// Path to data files
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');
const PERSONNEL_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.personnels.json');

// Helper function to extract first and last name from email
function extractNameFromEmail(email) {
  try {
    // Format: firstname.lastname@domain.com
    const localPart = email.split('@')[0];
    if (!localPart) return null;
    
    const nameParts = localPart.split('.');
    if (nameParts.length < 2) return null;
    
    // Convert to title case
    const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    const lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
    
    return { firstName, lastName };
  } catch (e) {
    return null;
  }
}

try {
  console.log('Loading trainings and personnel data...');
  
  const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
  const personnelData = JSON.parse(fs.readFileSync(PERSONNEL_FILE, 'utf8'));
  
  console.log(`Loaded ${trainingsData.length} training records and ${personnelData.length} personnel records`);
  
  // Create a map of personnel by email for faster lookups
  const personnelEmailMap = new Map();
  personnelData.forEach(person => {
    if (person.email) {
      personnelEmailMap.set(person.email, person);
    }
  });
  
  console.log(`Created personnel email map with ${personnelEmailMap.size} entries`);
  
  // Track changes
  let totalUpdatedTrainings = 0;
  let totalUpdatedAttendees = 0;
  
  // Process each training record
  const updatedTrainingsData = trainingsData.map(training => {
    if (!training.attendees || training.attendees.length === 0) {
      return training; // Skip trainings with no attendees
    }
    
    let trainingUpdated = false;
    let trainingUpdatedAttendees = 0;
    
    // Update each attendee with correct name data
    const updatedAttendees = training.attendees.map(attendee => {
      // Skip if we already have full name data
      if (attendee.userData?.fullName && attendee.userData.fullName.trim() !== '') {
        return attendee;
      }
      
      // Get the email from userData if available
      const email = attendee.userData?.email;
      if (!email) {
        return attendee; // Skip if no email
      }
      
      // Find the personnel record by email
      const person = personnelEmailMap.get(email);
      if (!person) {
        // If person not found, extract name from email
        const nameFromEmail = extractNameFromEmail(email);
        if (nameFromEmail) {
          trainingUpdatedAttendees++;
          trainingUpdated = true;
          
          return {
            ...attendee,
            userData: {
              ...attendee.userData,
              firstName: nameFromEmail.firstName,
              lastName: nameFromEmail.lastName,
              fullName: `${nameFromEmail.firstName} ${nameFromEmail.lastName}`
            }
          };
        }
        return attendee;
      }
      
      // Update with data from found personnel
      trainingUpdatedAttendees++;
      trainingUpdated = true;
      
      return {
        ...attendee,
        userData: {
          ...attendee.userData,
          firstName: person.firstName || '',
          lastName: person.lastName || '',
          fullName: `${person.firstName || ''} ${person.lastName || ''}`.trim()
        }
      };
    });
    
    // Update our totals
    totalUpdatedAttendees += trainingUpdatedAttendees;
    
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
  
  console.log('\nTraining Names Update Summary:');
  console.log('--------------------------------');
  console.log(`Total training records: ${trainingsData.length}`);
  console.log(`Training records updated: ${totalUpdatedTrainings}`);
  console.log(`Attendee records updated: ${totalUpdatedAttendees}`);
  
  console.log('\nTraining attendee names updated successfully!');
  
} catch (error) {
  console.error('Error updating training attendee names:', error);
  process.exit(1);
} 