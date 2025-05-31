const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://localhost:27017/afp_personnel_db';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('personnels');
    
    // Count current records
    const countBefore = await collection.countDocuments();
    console.log(`Current record count: ${countBefore}`);
    
    // Define the 6 companies to distribute records across
    const companies = [
      'Alpha', 
      'Bravo', 
      'Charlie', 
      'Headquarters',
      'NERRSC (Signal Company)',
      'NERFAB (Artillery Battalion)'
    ];
    
    // Fetch all records
    const allRecords = await collection.find({}).toArray();
    console.log(`Retrieved ${allRecords.length} records`);
    
    // Distribute records across companies and set as verified
    const updatePromises = allRecords.map((record, index) => {
      const companyIndex = index % companies.length;
      const company = companies[companyIndex];
      
      return collection.updateOne(
        { _id: record._id },
        { 
          $set: { 
            company: company,
            isVerified: true,
            isActive: true,
            status: 'Ready'
          } 
        }
      );
    });
    
    // Execute all updates
    const updateResults = await Promise.all(updatePromises);
    
    // Count how many documents were modified
    const totalModified = updateResults.reduce((acc, result) => acc + result.modifiedCount, 0);
    console.log(`Updated ${totalModified} records with new company assignments and verification status`);
    
    // Print distribution of companies
    const companyStats = {};
    for (const company of companies) {
      const count = await collection.countDocuments({ company });
      companyStats[company] = count;
    }
    
    console.log('Company distribution:');
    for (const [company, count] of Object.entries(companyStats)) {
      console.log(`${company}: ${count} personnel`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main(); 