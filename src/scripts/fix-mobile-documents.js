// Script to fix documents uploaded from the mobile app
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb://localhost:27017/afp_personnel_db';

// Function to fix mobile documents
async function fixMobileDocuments() {
  const client = new MongoClient(uri);
  
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database and collections
    const db = client.db();
    const documentsCollection = db.collection('documents');
    const personnelsCollection = db.collection('personnels');
    
    // Find all documents with userId as string "current_user" (from mobile app)
    const mobileDocuments = await documentsCollection.find({ 
      userId: "current_user" 
    }).toArray();
    
    console.log(`Found ${mobileDocuments.length} documents from mobile app`);
    
    if (mobileDocuments.length === 0) {
      console.log('No mobile documents found that need fixing.');
      return;
    }
    
    // Get a personnel to assign documents to
    let personnel = await personnelsCollection.findOne({ serviceNumber: '2019-10180' });
    if (!personnel) {
      console.log('No personnel found with service number 2019-10180. Trying any personnel...');
      const anyPersonnel = await personnelsCollection.findOne({});
      if (!anyPersonnel) {
        console.log('No personnel found in the database. Cannot fix documents.');
        return;
      }
      console.log(`Will assign documents to personnel: ${anyPersonnel.firstName} ${anyPersonnel.lastName} (${anyPersonnel._id})`);
      personnel = anyPersonnel;
    } else {
      console.log(`Will assign documents to personnel: ${personnel.firstName} ${personnel.lastName} (${personnel._id})`);
    }
    
    // Process each document
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const doc of mobileDocuments) {
      try {
        console.log(`Processing document: ${doc._id} - ${doc.title}`);
        
        // Fix the document
        const updateData = {
          userId: personnel._id, // Set to actual user ID
          uploadedBy: personnel._id, // Set proper reference
          uploadDate: new Date(), // Set to current date
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // If uploadedAt is in the future, fix it
        if (doc.uploadedAt && new Date(doc.uploadedAt) > new Date()) {
          console.log(`Fixing future date: ${doc.uploadedAt}`);
          updateData.uploadedAt = new Date();
        }
        
        // Update document type if needed
        if (doc.type && !['training_certificate', 'medical_record', 'identification', 'promotion', 'commendation', 'other'].includes(doc.type)) {
          // Map to a valid type
          let mappedType = 'other';
          
          const typeMapping = {
            'Birth Certificate': 'other',
            'ID Card': 'identification',
            'Picture 2x2': 'identification',
            '3R ROTC Certificate': 'training_certificate',
            'Enlistment Order': 'other',
            'Promotion Order': 'promotion',
            'Order of Incorporation': 'other',
            'Schooling Certificate': 'training_certificate',
            'College Diploma': 'training_certificate',
            'RIDS': 'other',
            'Deployment Order': 'other',
            'Medical Certificate': 'medical_record',
            'Training Certificate': 'training_certificate',
            'Commendation': 'commendation',
            'Other': 'other'
          };
          
          mappedType = typeMapping[doc.type] || 'other';
          
          console.log(`Mapping type from "${doc.type}" to "${mappedType}"`);
          updateData.type = mappedType;
        }
        
        // Update the document
        const result = await documentsCollection.updateOne(
          { _id: doc._id },
          { $set: updateData }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`Updated document: ${doc._id}`);
        } else {
          console.log(`No changes made to document: ${doc._id}`);
        }
      } catch (e) {
        console.error(`Error processing document ${doc._id}: ${e.message}`);
        errorCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} documents`);
    console.log(`Encountered errors with ${errorCount} documents`);
    
    // Verify the fixes
    const fixedDoc = await documentsCollection.findOne({ _id: mobileDocuments[0]._id });
    if (fixedDoc) {
      console.log('Sample fixed document:');
      console.log(JSON.stringify({
        _id: fixedDoc._id,
        title: fixedDoc.title,
        userId: fixedDoc.userId,
        uploadedBy: fixedDoc.uploadedBy,
        uploadDate: fixedDoc.uploadDate,
        type: fixedDoc.type
      }, null, 2));
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
fixMobileDocuments()
  .then(() => console.log('Script completed'))
  .catch(err => console.error(`Script failed: ${err.message}`)); 