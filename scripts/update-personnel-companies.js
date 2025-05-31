/**
 * Script to update personnel company values to match official companies in the system
 * 
 * This script:
 * 1. Loads the personnel and companies data from JSON files
 * 2. Maps incorrect company values to the correct ones from the companies database
 * 3. Updates personnel records with correct company values
 * 4. Saves the updated personnel data back to the file
 * 
 * Run with: node scripts/update-personnel-companies.js
 */

const fs = require('fs');
const path = require('path');

// Path to data files
const PERSONNEL_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.personnels.json');
const COMPANIES_FILE = path.join(__dirname, '../afp_personnel_db/afp_personnel_db.companies.json');

// Load data from files
try {
  console.log('Loading personnel and companies data...');
  
  const personnelData = JSON.parse(fs.readFileSync(PERSONNEL_FILE, 'utf8'));
  const companiesData = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
  
  // Extract valid company names from companies data
  const validCompanies = companiesData.map(company => ({
    id: company._id.$oid,
    name: company.name,
    code: company.code
  }));
  
  console.log(`Loaded ${personnelData.length} personnel records and ${validCompanies.length} company records`);
  
  // Create a mapping of incorrect company names to valid ones
  // This handles common variations, abbreviations, and mistakes
  const companyMap = {};
  
  // Auto-generate mappings based on name similarity
  validCompanies.forEach(company => {
    companyMap[company.name.toLowerCase()] = company.name;
    companyMap[company.code.toLowerCase()] = company.name;
    
    // Add some common variations
    if (company.code) {
      companyMap[company.code.toLowerCase().replace(/[^a-z0-9]/g, '')] = company.name;
    }
    
    // Handle company names without parentheses
    if (company.name.includes('(')) {
      const shortName = company.name.split('(')[0].trim();
      companyMap[shortName.toLowerCase()] = company.name;
    }
  });
  
  // Add specific mappings for known problematic cases
  companyMap['alpha'] = 'Alpha Company';
  companyMap['bravo'] = 'Bravo Company';
  companyMap['charlie'] = 'Charlie Company';
  companyMap['delta'] = 'Delta Company';
  companyMap['echo'] = 'Echo Company';
  companyMap['foxtrot'] = 'Foxtrot Company';
  companyMap['hq'] = 'Headquarters';
  companyMap['headquarters'] = 'Headquarters';
  companyMap['nerrsc'] = 'NERRSC (NERR-Signal Company)';
  companyMap['nerrfab'] = 'NERRFAB (NERR-Field Artillery Battery)';
  companyMap['1st infantry division'] = 'Alpha Company';
  companyMap['2nd infantry division'] = 'Bravo Company';
  companyMap['special forces'] = 'Delta Company';
  companyMap['intelligence unit'] = 'NERRSC (NERR-Signal Company)';
  companyMap['naval forces'] = 'Echo Company';
  companyMap['air force squadron'] = 'Foxtrot Company';
  
  // Keep track of stats
  let updatedCount = 0;
  let unchangedCount = 0;
  let unmappedCompanies = new Set();
  
  // Process each personnel record
  const updatedPersonnel = personnelData.map(person => {
    const originalCompany = person.company;
    
    // Skip if no company property
    if (!originalCompany) {
      unchangedCount++;
      return person;
    }
    
    // Try to map the company name to a valid one
    const lookupKey = originalCompany.toLowerCase().trim();
    if (companyMap[lookupKey]) {
      // We found a mapping - update the company name
      person.company = companyMap[lookupKey];
      updatedCount++;
    } else {
      // No mapping found - keep track of unmapped companies
      unchangedCount++;
      unmappedCompanies.add(originalCompany);
    }
    
    return person;
  });
  
  // Save the updated personnel data back to the file
  fs.writeFileSync(PERSONNEL_FILE, JSON.stringify(updatedPersonnel, null, 2));
  
  console.log('\nPersonnel Company Update Summary:');
  console.log('-------------------------------');
  console.log(`Total personnel records: ${personnelData.length}`);
  console.log(`Records updated: ${updatedCount}`);
  console.log(`Records unchanged: ${unchangedCount}`);
  
  if (unmappedCompanies.size > 0) {
    console.log('\nUnmapped company values:');
    console.log('--------------------');
    Array.from(unmappedCompanies).sort().forEach(company => {
      console.log(`- "${company}"`);
    });
    console.log('\nYou may want to add these to the company mapping if they should map to existing companies.');
  }
  
  console.log('\nValid company names in the system:');
  console.log('-------------------------------');
  validCompanies.forEach(company => {
    console.log(`- ${company.name} (${company.code})`);
  });
  
  console.log('\nPersonnel company values updated successfully!');
  
} catch (error) {
  console.error('Error updating personnel company values:', error);
  process.exit(1);
} 