const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = 'mongodb://localhost:27017/afp_personnel_db';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('personnels');
    
    // Find all records that have ObjectId as company
    const records = await collection.find({
      company: { $type: "objectId" }
    }).toArray();
    
    console.log(`Found ${records.length} records with ObjectId company field`);
    
    // Map of known company ObjectIds to string values
    const companyMap = {
      "67efd5b3c7528c0dfb154429": "SRRSC (Infantry Unit)", // Based on error log
      // Add more mappings if needed
    };
    
    // Default company to use if no mapping exists
    const defaultCompany = "Alpha";
    
    // Update each record to have string company
    let updatedCount = 0;
    
    for (const record of records) {
      const companyId = record.company.toString();
      const companyName = companyMap[companyId] || defaultCompany;
      
      console.log(`Updating record ${record._id}: changing company from ${companyId} to "${companyName}"`);
      
      const result = await collection.updateOne(
        { _id: record._id },
        { $set: { company: companyName } }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} records with string company values`);
    
    // Additional fix: Check for any records with the email "ibrahim@gmail.com"
    const ibrahimRecord = await collection.findOne({ 
      $or: [
        { email: "ibrahim@gmail.com" },
        { alternativeEmail: "ibrahim@gmail.com" }
      ]
    });
    
    if (ibrahimRecord) {
      console.log(`Found Ibrahim's record: ${ibrahimRecord._id}`);
      
      // Make sure everything is properly set
      const updateResult = await collection.updateOne(
        { _id: ibrahimRecord._id },
        { 
          $set: { 
            company: ibrahimRecord.company.toString ? ibrahimRecord.company.toString() : ibrahimRecord.company,
            isVerified: true,
            isActive: true,
            status: "Ready"
          } 
        }
      );
      
      console.log(`Updated Ibrahim's record: ${updateResult.modifiedCount} modified`);
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