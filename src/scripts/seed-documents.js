// Script to seed sample documents with proper user references
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb://localhost:27017/afp_personnel_db';

// Sample document types
const documentTypes = [
  'training_certificate',
  'medical_record',
  'identification',
  'promotion',
  'commendation',
  'other'
];

// Function to create a random date within the last year
function randomDate() {
  const now = new Date();
  const pastYear = new Date(now);
  pastYear.setFullYear(now.getFullYear() - 1);
  
  return new Date(pastYear.getTime() + Math.random() * (now.getTime() - pastYear.getTime()));
}

// Function to seed documents
async function seedDocuments() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database and collections
    const db = client.db();
    const documentsCollection = db.collection('documents');
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    // Log user details to help with debugging
    users.forEach((user, index) => {
      console.log(`User ${index + 1}: ${user.firstName || ''} ${user.lastName || ''}, Role: ${user.role || 'N/A'}, ID: ${user._id}`);
    });
    
    // Create sample documents for each user
    const sampleDocuments = [];
    
    for (const user of users) {
      // Skip creating documents for admin users
      if (user.role === 'admin' || user.role === 'staff') {
        console.log(`Skipping document creation for admin/staff user: ${user.firstName || ''} ${user.lastName || ''}`);
        continue;
      }
      
      // Create 1-3 documents for each user
      const numDocs = Math.floor(Math.random() * 3) + 1;
      console.log(`Creating ${numDocs} documents for user: ${user.firstName || ''} ${user.lastName || ''}`);
      
      for (let i = 0; i < numDocs; i++) {
        const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
        const uploadDate = randomDate();
        const status = ['pending', 'verified', 'rejected'][Math.floor(Math.random() * 3)];
        
        const docData = {
          title: `${docType.replace('_', ' ')} for ${user.firstName || 'User'}`,
          name: `${docType.replace('_', ' ')} for ${user.firstName || 'User'}`,
          description: `Sample ${docType.replace('_', ' ')} document`,
          type: docType,
          fileUrl: 'https://example.com/sample.pdf',
          fileName: 'sample.pdf',
          fileSize: 1024 * 1024, // 1MB
          mimeType: 'application/pdf',
          userId: user._id,
          uploadedBy: user._id, // Properly reference the user
          status: status,
          uploadDate: uploadDate,
          createdAt: uploadDate,
          updatedAt: uploadDate,
          version: 1
        };
        
        sampleDocuments.push(docData);
        console.log(`Created sample document: ${docData.title} with status ${status}`);
      }
    }
    
    // Insert documents if there are any to insert
    if (sampleDocuments.length > 0) {
      console.log(`Inserting ${sampleDocuments.length} sample documents into MongoDB...`);
      const result = await documentsCollection.insertMany(sampleDocuments);
      console.log(`Successfully inserted ${result.insertedCount} sample documents`);
      
      // Verify documents were inserted
      const count = await documentsCollection.countDocuments();
      console.log(`Total documents in collection: ${count}`);
      
      // Print a sample of the inserted documents
      const insertedDocs = await documentsCollection.find().limit(3).toArray();
      console.log('Sample of inserted documents:');
      insertedDocs.forEach((doc, index) => {
        console.log(`Document ${index + 1}: ${doc.title}, Status: ${doc.status}, ID: ${doc._id}`);
      });
    } else {
      console.log('No sample documents created');
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
seedDocuments()
  .then(() => console.log('Script completed'))
  .catch(err => console.error(`Script failed: ${err.message}`)); 