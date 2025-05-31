// This script updates all personnel status to "active" and removes any companies 
// that are not in the approved list

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection string from environment variables
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// List of approved companies
const APPROVED_COMPANIES = [
  'Alpha',
  'Bravo',
  'Charlie',
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

async function main() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // 1. Update all personnel status to "active"
    const userResult = await db.collection('users').updateMany(
      { 
        status: { $in: ['standby', 'Standby', 'retired', 'Retired'] } 
      },
      { 
        $set: { status: 'active' } 
      }
    );
    
    console.log(`Updated ${userResult.modifiedCount} users to active status`);
    
    // 2. Delete any companies that are not in the approved list
    const companyResult = await db.collection('companies').deleteMany(
      { 
        name: { $nin: APPROVED_COMPANIES } 
      }
    );
    
    console.log(`Removed ${companyResult.deletedCount} unauthorized companies`);
    
    // 3. Make sure all approved companies exist
    const bulkOps = APPROVED_COMPANIES.map(companyName => {
      return {
        updateOne: {
          filter: { name: companyName },
          update: { 
            $setOnInsert: { 
              name: companyName,
              code: companyName.split(' ')[0].toUpperCase(),
              totalPersonnel: 0,
              activePersonnel: 0,
              readinessScore: 0,
              documentsComplete: 0,
              trainingsComplete: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            } 
          },
          upsert: true
        }
      };
    });
    
    if (bulkOps.length > 0) {
      const upsertResult = await db.collection('companies').bulkWrite(bulkOps);
      console.log(`Ensured all approved companies exist (${upsertResult.upsertedCount} created)`);
    }
    
    console.log('Database update completed successfully');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error); 