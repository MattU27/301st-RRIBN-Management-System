// MongoDB Policy File Link Update Script
// This script updates a policy document to link it with an existing GridFS file

const { MongoClient, ObjectId } = require('mongodb');

// Database connection details
const uri = 'mongodb://localhost:27017';
const dbName = 'afp_personnel_db'; // Change this if your database name is different

// Policy ID to update (this is the policy ID we saw in MongoDB Compass)
const policyId = '6845807197ac6d37908a04ea';

// File ID that we need to set (this is the file ID we saw in MongoDB Compass - from policyFiles.files)
// The actual file ID in GridFS, not the one in the policy document
const fileId = '6845807197ac6d37908a04ea';

async function updatePolicyFileLink() {
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    
    // List all collections in the database to identify the correct ones
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Look for GridFS collections (they should follow the pattern 'policyFiles.files' and 'policyFiles.chunks')
    const gridFsCollections = collections.filter(c => c.name.includes('.files') || c.name.includes('.chunks'));
    
    if (gridFsCollections.length > 0) {
      console.log('\nFound GridFS collections:');
      gridFsCollections.forEach(c => console.log(`- ${c.name}`));
    }
    
    // Check if our expected collections exist
    const policiesCollection = db.collection('policies');

    // First, check if the policy exists
    const policy = await policiesCollection.findOne({ _id: new ObjectId(policyId) });

    if (!policy) {
      console.error(`Policy with ID ${policyId} not found`);
      return;
    }

    console.log(`\nFound policy: ${policy.title}`);
    console.log(`Current fileId: ${policy.fileId || 'null'}`);

    // Check if the file exists in GridFS files collection 
    const policyFilesCollection = db.collection('policyFiles.files');
    const file = await policyFilesCollection.findOne({ _id: new ObjectId(fileId) });

    if (!file) {
      console.error(`File with ID ${fileId} not found in GridFS policyFiles.files collection`);
      
      // List all files in the collection to help identify the correct file
      const allFiles = await policyFilesCollection.find({}).toArray();
      console.log(`\nFound ${allFiles.length} files in GridFS policyFiles.files collection:`);
      allFiles.forEach((f, index) => {
        console.log(`[${index+1}] ID: ${f._id}, Filename: ${f.filename}, Length: ${f.length} bytes`);
      });
      
      return;
    }

    console.log(`\nFound file in policyFiles.files: ${file.filename}, size: ${file.length} bytes`);

    // Update the policy document to include the fileId (fixed)
    // Instead of using the policyId as the fileId, we'll use the actual fileId from GridFS
    const result = await policiesCollection.updateOne(
      { _id: new ObjectId(policyId) },
      { $set: { fileId: new ObjectId(fileId) } }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Successfully updated policy document with fileId reference');
      
      // Verify the update
      const updatedPolicy = await policiesCollection.findOne({ _id: new ObjectId(policyId) });
      console.log(`Updated policy now has fileId: ${updatedPolicy.fileId}`);
    } else {
      console.log('❌ No changes made to the policy document');
      
      // Check if fileId is already set but might be a different format or value
      if (policy.fileId) {
        console.log(`Policy already has fileId: ${policy.fileId}`);
        
        if (policy.fileId.toString() !== new ObjectId(fileId).toString()) {
          console.log(`\nWarning: Policy fileId (${policy.fileId}) does not match the expected file ID (${fileId})`);
          
          // Try to update with a different command (force update)
          const forceResult = await policiesCollection.updateOne(
            { _id: new ObjectId(policyId) },
            { $set: { fileId: new ObjectId(fileId) } },
            { upsert: false }
          );
          
          console.log(`Force update result: ${JSON.stringify(forceResult)}`);
          
          // Verify the update again
          const reUpdatedPolicy = await policiesCollection.findOne({ _id: new ObjectId(policyId) });
          console.log(`Re-updated policy now has fileId: ${reUpdatedPolicy.fileId}`);
        }
      }
    }

  } catch (error) {
    console.error('Error updating policy:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the update function
updatePolicyFileLink()
  .then(() => console.log('Script execution completed'))
  .catch(err => console.error('Script execution failed:', err)); 