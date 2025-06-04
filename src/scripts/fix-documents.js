// Script to fix documents in MongoDB by ensuring they have proper user references
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
    const usersCollection = db.collection('users');
    
    // Find all documents
    const documents = await documentsCollection.find({}).toArray();
    console.log(`Found ${documents.length} documents`);
    
    // Get default admin user for documents without a valid user
    const adminUser = await usersCollection.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }
    
    // Process each document
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const doc of documents) {
      try {
        // Check if uploadedBy is missing or not a valid ObjectId
        let needsUpdate = false;
        let updateData = {};
        
        // Check uploadedBy field
        if (!doc.uploadedBy || typeof doc.uploadedBy === 'string') {
          // Try to find the user by userId if available
          let userId = doc.userId;
          if (userId) {
            // Convert string to ObjectId if needed
            if (typeof userId === 'string') {
              try {
                userId = new ObjectId(userId);
              } catch (e) {
                console.log(`Invalid userId format: ${userId}`);
              }
            }
            
            // Try to find the user
            const user = await usersCollection.findOne({ _id: userId });
            if (user) {
              updateData.uploadedBy = user._id;
              needsUpdate = true;
            } else {
              // Use admin as fallback
              updateData.uploadedBy = adminUser._id;
              needsUpdate = true;
            }
          } else {
            // Use admin as fallback
            updateData.uploadedBy = adminUser._id;
            needsUpdate = true;
          }
        }
        
        // Check uploadDate field
        if (!doc.uploadDate) {
          updateData.uploadDate = doc.createdAt || new Date();
          needsUpdate = true;
        }
        
        // Update the document if needed
        if (needsUpdate) {
          const result = await documentsCollection.updateOne(
            { _id: doc._id },
            { $set: updateData }
          );
          
          if (result.modifiedCount > 0) {
            updatedCount++;
            console.log(`Updated document: ${doc._id}`);
          }
        }
      } catch (e) {
        console.error(`Error processing document ${doc._id}: ${e.message}`);
        errorCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} documents`);
    console.log(`Encountered errors with ${errorCount} documents`);
    
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