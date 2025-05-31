/**
 * Script to update personnel records with valid ranks and companies
 * Based on the dropdown values from the screenshots
 */

const { MongoClient } = require('mongodb');

// MongoDB connection string - update if necessary
const uri = 'mongodb://localhost:27017/afp_personnel_db';

// Valid military ranks from the dropdown
const validRanks = [
  'Private',
  'Private First Class',
  'Corporal',
  'Sergeant',
  'Second Lieutenant',
  'First Lieutenant',
  'Captain',
  'Major',
  'Lieutenant Colonel',
  'Colonel',
  'Brigadier General'
];

// Valid companies from the dropdown
const validCompanies = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

// Map of invalid ranks to valid ones
const rankMapping = {
  // Custom mapping for your existing ranks
  'PVT': 'Private',
  'PFC': 'Private First Class',
  'CPL': 'Corporal',
  'SGT': 'Sergeant',
  'SGM': 'Sergeant', // Assuming Sergeant Major should be Sergeant
  '2LT': 'Second Lieutenant',
  '1LT': 'First Lieutenant',
  'LT': 'Second Lieutenant', // Default LT to Second Lieutenant
  'CAPT': 'Captain',
  'CPT': 'Captain',
  'MAJ': 'Major',
  'LTC': 'Lieutenant Colonel',
  'COL': 'Colonel',
  'BG': 'Brigadier General',
  'GEN': 'Brigadier General',
  'MSG': 'Sergeant', // Map Master Sergeant to Sergeant
  'SFC': 'Sergeant', // Map Sergeant First Class to Sergeant
  'CSM': 'Sergeant', // Map Command Sergeant Major to Sergeant
  'ATC': 'Private', // Default to Private if unknown
  'FMCPO': 'Private', // Default to Private if unknown
  'TSG': 'Sergeant', // Assuming Technical Sergeant maps to Sergeant
  'RADM': 'Colonel', // Map Rear Admiral to Colonel
};

// Map of invalid companies to valid ones
const companyMapping = {
  // Custom mapping for existing companies
  'HQ': 'Headquarters',
  'FOXTROT': 'Alpha', // Default to Alpha if not found
  'NERRRSC': 'NERRSC (NERR-Signal Company)',
  'NERRSC': 'NERRSC (NERR-Signal Company)',
  'ENGBAT': 'Alpha', // Default to Alpha if unknown
  'INTELDIV': 'Alpha', // Default to Alpha if unknown
  'MEDCORP': 'Alpha', // Default to Alpha if unknown
  'DELTA': 'Alpha', // Default to Alpha if unknown
  'ECHO': 'Alpha', // Default to Alpha if unknown
  'HOTEL': 'Alpha', // Default to Alpha if unknown
  'NERRFAB': 'NERRFAB (NERR-Field Artillery Battery)',
};

async function updateRanksAndCompanies() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const personnelCollection = db.collection('personnels');
    
    // Get all personnel records
    const allPersonnel = await personnelCollection.find({}).toArray();
    console.log(`Found ${allPersonnel.length} personnel records`);
    
    let updatedRanks = 0;
    let updatedCompanies = 0;
    
    // Process each record
    for (const person of allPersonnel) {
      const updates = {};
      
      // Check and update rank
      if (person.rank && !validRanks.includes(person.rank)) {
        // Get the mapped rank or default to Private
        const newRank = rankMapping[person.rank] || 'Private';
        updates.rank = newRank;
        updatedRanks++;
        console.log(`Updating rank for ${person.name || person._id}: ${person.rank} -> ${newRank}`);
      }
      
      // Check and update company
      if (person.company && !validCompanies.includes(person.company)) {
        // Get the mapped company or default to Alpha
        const newCompany = companyMapping[person.company] || 'Alpha';
        updates.company = newCompany;
        updatedCompanies++;
        console.log(`Updating company for ${person.name || person._id}: ${person.company} -> ${newCompany}`);
      }
      
      // Update the record if needed
      if (Object.keys(updates).length > 0) {
        updates.lastUpdated = new Date(); // Update lastUpdated field
        await personnelCollection.updateOne(
          { _id: person._id },
          { $set: updates }
        );
      }
    }
    
    console.log(`\nUpdate Summary:`);
    console.log(`- Total personnel records: ${allPersonnel.length}`);
    console.log(`- Updated ranks: ${updatedRanks}`);
    console.log(`- Updated companies: ${updatedCompanies}`);
    
  } catch (error) {
    console.error('Error updating ranks and companies:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateRanksAndCompanies()
  .then(() => console.log('Update script completed'))
  .catch(error => console.error('Script failed:', error)); 