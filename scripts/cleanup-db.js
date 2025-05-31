// Cleanup script to remove the incorrect database
const { MongoClient } = require('mongodb');

async function cleanupDatabases() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('Connected to MongoDB successfully');

    // List all databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    console.log('Available databases:');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });

    // Check if the incorrect hyphenated database exists
    const incorrectDbName = 'afp-personnel-db';
    if (dbs.databases.some(db => db.name === incorrectDbName)) {
      console.log(`Found incorrect database: ${incorrectDbName}`);
      
      // Drop the incorrect database
      console.log(`Dropping database: ${incorrectDbName}`);
      await client.db(incorrectDbName).dropDatabase();
      console.log(`✅ Successfully dropped database: ${incorrectDbName}`);
    } else {
      console.log(`The incorrect database ${incorrectDbName} does not exist.`);
    }

    // Verify the correct database exists
    const correctDbName = 'afp_personnel_db';
    if (dbs.databases.some(db => db.name === correctDbName)) {
      console.log(`✅ Correct database exists: ${correctDbName}`);
      
      // List collections in the correct database
      const correctDb = client.db(correctDbName);
      const collections = await correctDb.listCollections().toArray();
      
      console.log(`Collections in ${correctDbName}:`);
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
      
      // Check if personnels collection exists
      if (collections.some(c => c.name === 'personnels')) {
        const count = await correctDb.collection('personnels').countDocuments();
        console.log(`✅ 'personnels' collection has ${count} documents`);
      } else {
        console.log(`❌ 'personnels' collection does not exist in ${correctDbName}`);
      }
    } else {
      console.log(`❌ The correct database ${correctDbName} does not exist.`);
    }

    await client.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error cleaning up databases:', error);
  }
}

// Run the function
cleanupDatabases(); 