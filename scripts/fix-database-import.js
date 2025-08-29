#!/usr/bin/env node

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'afp_personnel_db';

// Collection mapping (JSON file name -> MongoDB collection name)
const COLLECTION_MAPPING = {
  'afp_personnel_db.users.json': 'users',
  'afp_personnel_db.announcements.json': 'announcements',
  'afp_personnel_db.auditlogs.json': 'auditlogs',
  'afp_personnel_db.companies.json': 'companies',
  'afp_personnel_db.documents.json': 'documents',
  'afp_personnel_db.personnels.json': 'personnels',
  'afp_personnel_db.policies.json': 'policies',
  'afp_personnel_db.trainings.json': 'trainings',
  'afp_personnel_db.trainingregistrations.json': 'trainingregistrations',
  'afp_personnel_db.training_registrations.json': 'training_registrations',
  'afp_personnel_db.fs.files.json': 'fs.files',
  'afp_personnel_db.fs.chunks.json': 'fs.chunks',
  'afp_personnel_db.policyFiles.files.json': 'policyFiles.files',
  'afp_personnel_db.policyFiles.chunks.json': 'policyFiles.chunks',
  'afp_personnel_db.documents.files.json': 'documents.files',
  'afp_personnel_db.documents.chunks.json': 'documents.chunks',
  'afp_personnel_db.activities.json': 'activities',
  'afp_personnel_db.documentmodels.json': 'documentmodels',
  'afp_personnel_db.rids.json': 'rids',
  'afp_personnel_db.tokens.json': 'tokens'
};

/**
 * Convert MongoDB Extended JSON to native JavaScript types
 */
function convertExtendedJSON(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertExtendedJSON);
  }

  if (typeof obj === 'object') {
    // Handle MongoDB Extended JSON types
    if (obj.$oid) {
      return new ObjectId(obj.$oid);
    }
    
    if (obj.$date) {
      return new Date(obj.$date);
    }

    if (obj.$numberInt) {
      return parseInt(obj.$numberInt);
    }

    if (obj.$numberLong) {
      return parseInt(obj.$numberLong);
    }

    if (obj.$numberDouble) {
      return parseFloat(obj.$numberDouble);
    }

    // Recursively convert object properties
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertExtendedJSON(value);
    }
    return converted;
  }

  return obj;
}

/**
 * Import a single JSON file to MongoDB collection
 */
async function importCollection(db, filePath, collectionName) {
  try {
    console.log(`\nImporting ${filePath} to collection: ${collectionName}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return;
    }

    // Read and parse JSON file
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const rawData = JSON.parse(jsonData);

    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.log(`  ⚠️  No data to import from ${filePath}`);
      return;
    }

    // Convert extended JSON to native types
    const convertedData = convertExtendedJSON(rawData);
    
    console.log(`  📊 Converting ${convertedData.length} documents...`);

    // Get collection
    const collection = db.collection(collectionName);

    // Clear existing data
    const deleteResult = await collection.deleteMany({});
    console.log(`  🗑️  Cleared ${deleteResult.deletedCount} existing documents`);

    // Insert converted data
    if (convertedData.length > 0) {
      const insertResult = await collection.insertMany(convertedData, { ordered: false });
      console.log(`  ✅ Successfully imported ${insertResult.insertedCount} documents`);
    }

  } catch (error) {
    console.error(`  ❌ Error importing ${filePath}:`, error.message);
  }
}

/**
 * Main import function
 */
async function main() {
  let client;
  
  try {
    console.log('🚀 Starting MongoDB Extended JSON Import Process...');
    console.log(`📡 Connecting to: ${DB_URL}`);
    
    // Connect to MongoDB
    client = new MongoClient(DB_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    console.log(`📄 Using database: ${DB_NAME}`);

    // Get the afp_personnel_db directory path
    const dbDir = path.join(__dirname, '..', 'afp_personnel_db');
    
    if (!fs.existsSync(dbDir)) {
      throw new Error(`Database directory not found: ${dbDir}`);
    }

    console.log(`📁 Scanning directory: ${dbDir}`);

    // Import each collection
    for (const [fileName, collectionName] of Object.entries(COLLECTION_MAPPING)) {
      const filePath = path.join(dbDir, fileName);
      await importCollection(db, filePath, collectionName);
    }

    console.log('\n🎉 Import process completed successfully!');
    
    // Verify some key collections
    console.log('\n📊 Verification:');
    const users = await db.collection('users').countDocuments();
    const announcements = await db.collection('announcements').countDocuments();
    const trainings = await db.collection('trainings').countDocuments();
    
    console.log(`  Users: ${users} documents`);
    console.log(`  Announcements: ${announcements} documents`);
    console.log(`  Trainings: ${trainings} documents`);

    // Test a user document to verify proper ObjectId and Date conversion
    const testUser = await db.collection('users').findOne({ email: 'director@afp.gov.ph' });
    if (testUser) {
      console.log('\n🔍 Sample user verification:');
      console.log(`  _id type: ${typeof testUser._id} (should be object)`);
      console.log(`  _id is ObjectId: ${testUser._id instanceof ObjectId}`);
      console.log(`  createdAt type: ${typeof testUser.createdAt} (should be object)`);
      console.log(`  createdAt is Date: ${testUser.createdAt instanceof Date}`);
      console.log(`  lastLogin type: ${typeof testUser.lastLogin} (should be object)`);
      console.log(`  lastLogin is Date: ${testUser.lastLogin instanceof Date}`);
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the import
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertExtendedJSON, importCollection, main };
