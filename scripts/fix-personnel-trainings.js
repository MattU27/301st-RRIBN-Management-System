/**
 * Script to directly link training attendees with personnel data by email
 * 
 * This script:
 * 1. Loads the trainings and personnel data
 * 2. For each attendee, looks up personnel by email
 * 3. Directly updates all userData fields with proper personnel data
 * 4. Saves the updated trainings back to the database
 * 
 * Run with: node scripts/fix-personnel-trainings.js
 */

const fs = require('fs');
const path = require('path');

// Path to data files
const TRAININGS_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.trainings.json');
const PERSONNEL_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.personnels.json');

try {
  console.log('Loading trainings and personnel data...');
  
  const trainingsData = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf8'));
  const personnelData = JSON.parse(fs.readFileSync(PERSONNEL_FILE, 'utf8'));
  
  console.log(`Loaded ${trainingsData.length} training records and ${personnelData.length} personnel records`);
  
  // Create lookup maps for personnel
  const personnelByEmail = new Map();
  const personnelById = new Map();
  
  // Build lookup maps
  personnelData.forEach(person => {
    if (person.email) {
      personnelByEmail.set(person.email.toLowerCase(), person);
    }
    
    if (person._id && person._id.$oid) {
      personnelById.set(person._id.$oid, person);
    }
  });
  
  console.log(`Created personnel lookup maps: ${personnelByEmail.size} by email, ${personnelById.size} by ID`);
  
  // Track statistics
  let totalTrainingsUpdated = 0;
  let totalAttendeesUpdated = 0;
  let notFoundAttendees = 0;
  
  // Process each training
  const updatedTrainingsData = trainingsData.map(training => {
    if (!training.attendees || !Array.isArray(training.attendees) || training.attendees.length === 0) {
      return training;
    }
    
    let trainingUpdated = false;
    
    // Process each attendee
    const updatedAttendees = training.attendees.map(attendee => {
      // Try to find matching personnel by userId first
      let personnelRecord = null;
      let matchMethod = '';
      
      if (attendee.userId && attendee.userId.$oid) {
        personnelRecord = personnelById.get(attendee.userId.$oid);
        if (personnelRecord) {
          matchMethod = 'userId';
        }
      }
      
      // If no match by ID, try by email
      if (!personnelRecord && attendee.userData && attendee.userData.email) {
        const email = attendee.userData.email.toLowerCase();
        personnelRecord = personnelByEmail.get(email);
        if (personnelRecord) {
          matchMethod = 'email';
        }
      }
      
      if (personnelRecord) {
        // Found matching personnel - update all userData fields
        trainingUpdated = true;
        totalAttendeesUpdated++;
        
        // Extract name components if needed
        let firstName = '';
        let lastName = '';
        
        if (personnelRecord.name) {
          const nameParts = personnelRecord.name.split(' ');
          if (nameParts.length > 0) {
            firstName = nameParts[0];
            if (nameParts.length > 1) {
              lastName = nameParts.slice(1).join(' ');
            }
          }
        }
        
        return {
          ...attendee,
          userData: {
            firstName,
            lastName,
            fullName: personnelRecord.name || '',
            rank: personnelRecord.rank || '',
            company: personnelRecord.company || '',
            email: personnelRecord.email || '',
            serviceId: personnelRecord.serviceNumber || '',
            militaryId: personnelRecord.serviceNumber || '',
            phone: personnelRecord.phone || '',
            status: personnelRecord.status || '',
            role: personnelRecord.role || ''
          }
        };
      } else {
        // No matching personnel found
        notFoundAttendees++;
        
        // Try to ensure we have at least name from email
        if (attendee.userData && attendee.userData.email) {
          const email = attendee.userData.email;
          const nameParts = email.split('@')[0].split('.');
          
          if (nameParts.length >= 2) {
            const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
            const lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
            const fullName = `${firstName} ${lastName}`;
            
            trainingUpdated = true;
            
            return {
              ...attendee,
              userData: {
                ...attendee.userData,
                firstName,
                lastName,
                fullName
              }
            };
          }
        }
        
        return attendee;
      }
    });
    
    if (trainingUpdated) {
      totalTrainingsUpdated++;
      return {
        ...training,
        attendees: updatedAttendees
      };
    }
    
    return training;
  });
  
  // Save updated trainings data
  fs.writeFileSync(TRAININGS_FILE, JSON.stringify(updatedTrainingsData, null, 2));
  
  console.log('\nPersonnel-Training Update Summary:');
  console.log('----------------------------------');
  console.log(`Total training records: ${trainingsData.length}`);
  console.log(`Training records updated: ${totalTrainingsUpdated}`);
  console.log(`Attendee records updated: ${totalAttendeesUpdated}`);
  console.log(`Attendees with no matching personnel: ${notFoundAttendees}`);
  
  console.log('\nTraining attendee data updated successfully!');
  
} catch (error) {
  console.error('Error updating training attendee data:', error);
  process.exit(1);
} 