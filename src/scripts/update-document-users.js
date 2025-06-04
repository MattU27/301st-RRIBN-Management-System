// Script to update all documents to use a personnel record
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb://localhost:27017/afp_personnel_db';

// Function to update documents
async function updateDocuments() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database and collections
    const db = client.db();
    const documentsCollection = db.collection('documents');
    const personnelsCollection = db.collection('personnels');
    
    // Find the personnel record
    const personnel = await personnelsCollection.findOne({ serviceNumber: '2019-10180' });
    
    if (!personnel) {
      console.log('No personnel found with service number 2019-10180.');
      return;
    }
    
    console.log(`Found personnel: ${personnel.firstName} ${personnel.lastName} (${personnel._id})`);
    
    // Update all documents to use this personnel
    const result = await documentsCollection.updateMany(
      { userId: "current_user" }, // Only update documents with userId = "current_user"
      { 
        $set: { 
          userId: personnel._id,
          uploadedBy: personnel._id
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} documents`);
    
    // Verify a sample document
    const sampleDoc = await documentsCollection.findOne({});
    if (sampleDoc) {
      console.log('Sample updated document:');
      console.log({
        _id: sampleDoc._id,
        title: sampleDoc.title,
        userId: sampleDoc.userId,
        uploadedBy: sampleDoc.uploadedBy
      });
    }
    
  } catch (e) {
    console.error(`Error: ${e.message}`);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
updateDocuments()
  .then(() => console.log('Script completed'))
  .catch(err => console.error(`Script failed: ${err.message}`)); 