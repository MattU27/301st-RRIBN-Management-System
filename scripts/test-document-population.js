// Script to test document population
// Run with: mongosh "mongodb://localhost:27017/afp_personnel_db" scripts/test-document-population.js

// Check if documents collection exists
const documentCount = db.documents.countDocuments();
print(`Found ${documentCount} documents in the database`);

if (documentCount === 0) {
  print("No documents found. Please run the seed-documents.js script first.");
  quit();
}

// Check if any documents have valid uploadedBy references
const documentsWithValidRefs = db.documents.find({
  uploadedBy: { $type: "objectId" }
}).count();

print(`Documents with valid ObjectId references for uploadedBy: ${documentsWithValidRefs}`);

// Check for string IDs that need to be converted
const documentsWithStringIds = db.documents.find({
  uploadedBy: { $type: "string" }
}).count();

print(`Documents with string references for uploadedBy: ${documentsWithStringIds}`);

// Try to populate a few documents
print("\nTesting document population:");
const populatedDocs = db.documents.aggregate([
  { $limit: 3 },
  {
    $lookup: {
      from: "users",
      localField: "uploadedBy",
      foreignField: "_id",
      as: "userInfo"
    }
  }
]).toArray();

// Check if population worked
populatedDocs.forEach((doc, index) => {
  print(`\nDocument ${index + 1}:`);
  print(`  ID: ${doc._id}`);
  print(`  Name: ${doc.name}`);
  print(`  UploadedBy: ${doc.uploadedBy}`);
  print(`  UploadedBy Type: ${typeof doc.uploadedBy}`);
  
  if (doc.userInfo && doc.userInfo.length > 0) {
    print(`  User found: ${doc.userInfo[0].firstName} ${doc.userInfo[0].lastName}`);
    print(`  Service ID: ${doc.userInfo[0].serviceId}`);
    print(`  Company: ${doc.userInfo[0].company || 'Not specified'}`);
  } else {
    print("  No user information found. Population failed.");
  }
});

// Fix documents with string IDs if needed
const fixStringIds = false; // Set to true to fix string IDs

if (fixStringIds && documentsWithStringIds > 0) {
  print("\nFixing documents with string IDs...");
  
  // Get all documents with string IDs
  const docsToFix = db.documents.find({
    uploadedBy: { $type: "string" }
  }).toArray();
  
  let fixedCount = 0;
  
  docsToFix.forEach(doc => {
    try {
      // Try to convert string to ObjectId
      const objectId = new ObjectId(doc.uploadedBy);
      
      // Update the document
      db.documents.updateOne(
        { _id: doc._id },
        { $set: { uploadedBy: objectId } }
      );
      
      fixedCount++;
    } catch (e) {
      print(`Error fixing document ${doc._id}: ${e.message}`);
    }
  });
  
  print(`Fixed ${fixedCount} documents`);
} 