const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = 'mongodb://localhost:27017/afp_personnel_db';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('personnels');
    
    // Get all records
    const allRecords = await collection.find({}).toArray();
    console.log(`Retrieved ${allRecords.length} records`);
    
    // Track how many records are updated
    let updatedCount = 0;
    
    // Fields that should be string dates in ISO format
    const dateFields = [
      'dateJoined',
      'createdAt',
      'updatedAt',
      'lastUpdated',
      'approvedAt',
      'rejectedAt'
    ];
    
    // Update each record to ensure date fields are strings
    for (const record of allRecords) {
      const updates = {};
      let needsUpdate = false;
      
      for (const field of dateFields) {
        if (record[field] instanceof Date) {
          console.log(`Converting ${field} for record ${record._id} from Date to ISO String`);
          updates[field] = record[field].toISOString();
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        const result = await collection.updateOne(
          { _id: record._id },
          { $set: updates }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
        }
      }
    }
    
    console.log(`Updated date formats for ${updatedCount} records`);
    
    // Check Ibrahim's record specifically
    const ibrahimRecord = await collection.findOne({ 
      $or: [
        { email: "ibrahim@gmail.com" },
        { alternativeEmail: "ibrahim@gmail.com" }
      ]
    });
    
    if (ibrahimRecord) {
      console.log(`Found Ibrahim's record: ${ibrahimRecord._id}`);
      console.log('Date fields:');
      for (const field of dateFields) {
        if (ibrahimRecord[field]) {
          console.log(`- ${field}: ${ibrahimRecord[field]} (type: ${typeof ibrahimRecord[field]})`);
        }
      }
      
      // Force update all date fields for Ibrahim's record to be strings
      const updates = {};
      let needsUpdate = false;
      
      for (const field of dateFields) {
        if (ibrahimRecord[field]) {
          if (ibrahimRecord[field] instanceof Date) {
            updates[field] = ibrahimRecord[field].toISOString();
            needsUpdate = true;
          } else if (typeof ibrahimRecord[field] !== 'string') {
            updates[field] = new Date(ibrahimRecord[field]).toISOString();
            needsUpdate = true;
          }
        }
      }
      
      if (needsUpdate) {
        const updateResult = await collection.updateOne(
          { _id: ibrahimRecord._id },
          { $set: updates }
        );
        
        console.log(`Updated Ibrahim's date fields: ${updateResult.modifiedCount} modified`);
      } else {
        console.log("No date fields needed updating for Ibrahim's record");
      }
    } else {
      console.log("No record found for Ibrahim's email");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main(); 