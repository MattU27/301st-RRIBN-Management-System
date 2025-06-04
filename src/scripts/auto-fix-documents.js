// Script to automatically fix documents with 'current_user' as userId
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb://localhost:27017/afp_personnel_db';

// Function to fix documents
async function fixDocuments() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database and collections
    const db = client.db();
    const documentsCollection = db.collection('documents');
    const personnelsCollection = db.collection('personnels');
    
    // Find documents with 'current_user' as userId
    const documentsToFix = await documentsCollection.find({ userId: 'current_user' }).toArray();
    
    console.log(`Found ${documentsToFix.length} documents with 'current_user' as userId`);
    
    // Find documents with unpopulated uploadedBy
    const unpopulatedDocs = await documentsCollection.find({ 
      $or: [
        { uploadedBy: { $exists: false } },
        { uploadedBy: null }
      ]
    }).toArray();
    
    console.log(`Found ${unpopulatedDocs.length} documents with unpopulated uploadedBy`);
    
    // Combine both arrays
    const allDocsToFix = [...documentsToFix, ...unpopulatedDocs];
    
    if (allDocsToFix.length === 0) {
      console.log('No documents need fixing');
      return;
    }
    
    // Find a personnel record to assign the documents to
    const personnel = await personnelsCollection.findOne({ serviceNumber: '2019-10180' });
    let targetPersonnel;
    
    if (!personnel) {
      console.log('No personnel found with service number 2019-10180. Trying any personnel...');
      const anyPersonnel = await personnelsCollection.findOne({});
      if (!anyPersonnel) {
        console.log('No personnel found in the database. Cannot fix documents.');
        return;
      }
      console.log(`Will assign documents to personnel: ${anyPersonnel.firstName} ${anyPersonnel.lastName} (${anyPersonnel._id})`);
      targetPersonnel = anyPersonnel;
      
      // Update documents
      const result = await documentsCollection.updateMany(
        { _id: { $in: allDocsToFix.map(doc => doc._id) } },
        { 
          $set: { 
            userId: anyPersonnel._id,
            uploadedBy: anyPersonnel._id
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} documents`);
    } else {
      console.log(`Will assign documents to personnel: ${personnel.firstName} ${personnel.lastName} (${personnel._id})`);
      targetPersonnel = personnel;
      
      // Update documents
      const result = await documentsCollection.updateMany(
        { _id: { $in: allDocsToFix.map(doc => doc._id) } },
        { 
          $set: { 
            userId: personnel._id,
            uploadedBy: personnel._id
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} documents`);
    }
    
    // Verify a sample document
    const sampleDoc = await documentsCollection.findOne({ userId: targetPersonnel._id });
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
fixDocuments()
  .then(() => console.log('Script completed'))
  .catch(err => console.error(`Script failed: ${err.message}`)); 