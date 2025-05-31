// Script to add a super director account to the database
const { MongoClient } = require('mongodb');

// Connection URL and Database Name
const url = 'mongodb://localhost:27017';
const dbName = 'afp_personnel_db';

async function addSuperDirector() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    // Get reference to the database
    const db = client.db(dbName);
    
    // Create super director user
    const superDirector = {
      firstName: 'Super',
      lastName: 'Director',
      email: 'afp.super.director@afp.gov.ph',
      // This is 'Password123' hashed with bcrypt
      password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG',
      role: 'director',
      status: 'active',
      militaryId: '2024-SD002',
      rank: 'General',
      company: 'HQ',
      specializations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the super director account
    const result = await db.collection('users').insertOne(superDirector);
    console.log(`Super director account created with ID: ${result.insertedId}`);

    // Close the connection
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the function
addSuperDirector(); 