#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function seedPersonnelData() {
  try {
    console.log('⚙️ AFP Personnel Management System - Data Seeding Tool');
    console.log('---------------------------------------------------');
    console.log('This script will seed the database with Filipino military personnel data.');
    console.log('You must be logged in as an admin or director to use this tool.\n');
    
    // Ask for JWT token
    const token = await new Promise(resolve => {
      rl.question('Please enter your JWT token: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!token) {
      console.error('❌ Error: JWT token is required');
      process.exit(1);
    }
    
    // Ask if the user wants to clear existing data
    const clearExisting = await new Promise(resolve => {
      rl.question('Do you want to clear existing personnel data first? (y/n): ', (answer) => {
        resolve(answer.trim().toLowerCase() === 'y');
      });
    });
    
    console.log('\n🔄 Seeding Filipino military personnel data...');
    
    // Call the seed API endpoint
    const response = await axios.post('http://localhost:3000/api/personnel/seed', 
      { clearExisting },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    if (response.data.success) {
      console.log('✅ Success!');
      console.log(`📊 ${response.data.data.count} personnel records have been seeded.`);
      if (response.data.data.cleared) {
        console.log('🗑️ Existing personnel data was cleared before seeding.');
      }
    } else {
      console.error(`❌ Error: ${response.data.error}`);
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error: ${error.response.data.error || 'API request failed'}`);
      console.error(`Status code: ${error.response.status}`);
    } else {
      console.error(`❌ Error: ${error.message || 'Unknown error occurred'}`);
    }
  } finally {
    rl.close();
  }
}

// Run the seed function
seedPersonnelData(); 