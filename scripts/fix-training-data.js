/**
 * Comprehensive script to fix training attendee data in the JSON database files
 * 
 * This script:
 * 1. Loads the trainings and personnel data from JSON files
 * 2. For each training attendee, finds the matching personnel record by userId, email, or name
 * 3. Updates all fields including firstName, lastName, fullName, rank, company, etc.
 * 4. Saves the updated trainings data back to the JSON file
 * 
 * Run with: node scripts/fix-training-data.js
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

// Helper function to extract first and last name from full name
function splitFullName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}

try {
  console.log('Loading trainings and personnel data...');
  
  const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
  const personnelData = JSON.parse(fs.readFileSync(PERSONNEL_FILE, 'utf8'));
  
  console.log(`Loaded ${trainingsData.length} training records and ${personnelData.length} personnel records`);
  
  // Create maps for faster lookups
  const personnelByIdMap = new Map();
  const personnelByEmailMap = new Map();
  const personnelByNameMap = new Map();
  
  personnelData.forEach(person => {
    // Store by ID
    if (person._id && person._id.$oid) {
      personnelByIdMap.set(person._id.$oid, person);
    }
    
    // Store by email
    if (person.email) {
      personnelByEmailMap.set(person.email.toLowerCase(), person);
    }
    
    // Store by name
    if (person.name) {
      personnelByNameMap.set(person.name.toLowerCase(), person);
    }
  });
  
  console.log(`Created personnel lookup maps: ${personnelByIdMap.size} by ID, ${personnelByEmailMap.size} by email, ${personnelByNameMap.size} by name`);
  
  // Track changes
  let totalTrainingsUpdated = 0;
  let totalAttendeesUpdated = 0;
  let notFoundPersonnel = 0;
  
  // Process each training record
  const updatedTrainingsData = trainingsData.map(training => {
    if (!training.attendees || training.attendees.length === 0) {
      return training; // Skip trainings with no attendees
    }
    
    let trainingUpdated = false;
    let trainingAttendeesUpdated = 0;
    
    // Update each attendee with correct personnel data
    const updatedAttendees = training.attendees.map(attendee => {
      // Try to find the personnel record by userId
      let personnelRecord = null;
      let lookupMethod = '';
      
      // Method 1: Try finding by userId
      if (attendee.userId && attendee.userId.$oid) {
        personnelRecord = personnelByIdMap.get(attendee.userId.$oid);
        if (personnelRecord) lookupMethod = 'ID';
      }
      
      // Method 2: Try finding by email
      if (!personnelRecord && attendee.userData && attendee.userData.email) {
        const email = attendee.userData.email.toLowerCase();
        personnelRecord = personnelByEmailMap.get(email);
        if (personnelRecord) lookupMethod = 'email';
      }
      
      // Method 3: Try finding by fullName
      if (!personnelRecord && attendee.userData && attendee.userData.fullName) {
        const fullName = attendee.userData.fullName.toLowerCase();
        personnelRecord = personnelByNameMap.get(fullName);
        if (personnelRecord) lookupMethod = 'fullName';
      }
      
      // If we found a personnel record, update the attendee data
      if (personnelRecord) {
        trainingAttendeesUpdated++;
        trainingUpdated = true;
        
        // Extract name components
        let firstName = personnelRecord.firstName || '';
        let lastName = personnelRecord.lastName || '';
        
        // If name components aren't available, try to extract from full name
        if ((!firstName || !lastName) && personnelRecord.name) {
          const nameParts = splitFullName(personnelRecord.name);
          firstName = firstName || nameParts.firstName;
          lastName = lastName || nameParts.lastName;
        }
        
        // Create full name
        const fullName = personnelRecord.name || 
          (firstName && lastName ? `${firstName} ${lastName}`.trim() : '');
        
        // Update the attendee with complete data
        return {
          ...attendee,
          userData: {
            ...attendee.userData,
            firstName,
            lastName,
            fullName,
            rank: personnelRecord.rank || '',
            company: personnelRecord.company || '',
            email: personnelRecord.email || attendee.userData?.email || '',
            militaryId: personnelRecord.serviceNumber || personnelRecord.militaryId || '',
            serviceId: personnelRecord.serviceNumber || personnelRecord.serviceId || ''
          }
        };
      } else {
        // If personnel record not found, try to improve what we have
        notFoundPersonnel++;
        
        // Try to extract name from email if it exists
        let firstName = attendee.userData?.firstName || '';
        let lastName = attendee.userData?.lastName || '';
        let fullName = attendee.userData?.fullName || '';
        
        if ((!firstName || !lastName) && attendee.userData?.email) {
          const nameFromEmail = extractNameFromEmail(attendee.userData.email);
          if (nameFromEmail) {
            firstName = firstName || nameFromEmail.firstName;
            lastName = lastName || nameFromEmail.lastName;
            fullName = fullName || `${firstName} ${lastName}`.trim();
          }
        }
        
        // Keep the rank and company if they're already in the userData
        const rank = attendee.userData?.rank || '';
        const company = attendee.userData?.company || '';
        
        // Update what we can
        trainingAttendeesUpdated++;
        trainingUpdated = true;
        
        return {
          ...attendee,
          userData: {
            ...attendee.userData,
            firstName,
            lastName,
            fullName,
            rank,
            company,
            email: attendee.userData?.email || '',
            militaryId: attendee.userData?.militaryId || '',
            serviceId: attendee.userData?.serviceId || ''
          }
        };
      }
    });
    
    // Update totals
    totalAttendeesUpdated += trainingAttendeesUpdated;
    
    if (trainingUpdated) {
      totalTrainingsUpdated++;
      return {
        ...training,
        attendees: updatedAttendees
      };
    }
    
    return training;
  });
  
  // Save the updated trainings data back to the file
  fs.writeFileSync(TRAININGS_FILE, JSON.stringify(updatedTrainingsData, null, 2));
  
  console.log('\nTraining Data Update Summary:');
  console.log('--------------------------------');
  console.log(`Total training records: ${trainingsData.length}`);
  console.log(`Training records updated: ${totalTrainingsUpdated}`);
  console.log(`Attendee records updated: ${totalAttendeesUpdated}`);
  console.log(`Personnel not found: ${notFoundPersonnel}`);
  
  console.log('\nTraining attendee data updated successfully!');
  
} catch (error) {
  console.error('Error updating training attendee data:', error);
  process.exit(1);
} 