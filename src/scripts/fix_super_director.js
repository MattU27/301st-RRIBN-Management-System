// Script to identify and fix super director account issues
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URL and Database Name
const url = 'mongodb://localhost:27017';
const dbName = 'afp_personnel_db';

async function fixSuperDirectorAccount() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    // Get reference to the database
    const db = client.db(dbName);
    
    // Check for existing director accounts
    const existingDirectors = await db.collection('users').find({ role: 'director' }).toArray();
    console.log(`Found ${existingDirectors.length} director accounts:`);
    existingDirectors.forEach((director, i) => {
      console.log(`\n[${i+1}] Director info:`);
      console.log(`  Name: ${director.firstName} ${director.lastName}`);
      console.log(`  Email: ${director.email}`);
      console.log(`  Role: ${director.role}`);
      console.log(`  Status: ${director.status}`);
      console.log(`  Military ID: ${director.militaryId || 'Not set'}`);
      console.log(`  Password format check: ${director.password ? 'Password exists' : 'No password'}`);
    });

    // Generate fresh password hash for "Password123"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    // Create a new super director with proper schema
    const newSuperDirector = {
      firstName: 'Super',
      lastName: 'Director',
      email: 'afp.super.director2@afp.gov.ph', // Using a different email
      password: hashedPassword, // Freshly hashed password
      role: 'director',
      status: 'active',
      militaryId: '2024-SD003',
      rank: 'General',
      company: 'HQ',
      specializations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the new super director account
    const result = await db.collection('users').insertOne(newSuperDirector);
    console.log(`\nNew super director account created with ID: ${result.insertedId}`);
    console.log(`Login credentials: afp.super.director2@afp.gov.ph / Password123`);

    // Close the connection
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the function
fixSuperDirectorAccount(); 