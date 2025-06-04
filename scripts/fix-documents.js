// Script to fix documents with missing uploadedBy references
// Run with: mongosh "mongodb://localhost:27017/afp_personnel_db" scripts/fix-documents.js

// Find documents with missing uploadedBy field
const documentsToFix = db.documents.find({
  $or: [
    { uploadedBy: { $exists: false } },
    { uploadedBy: null },
    { uploadedBy: "current_user" },
    { uploadedBy: "undefined" }
  ]
}).toArray();

print(`Found ${documentsToFix.length} documents with missing uploadedBy references`);

if (documentsToFix.length === 0) {
  print("No documents need fixing.");
  quit();
}

// Find a valid admin user to use as a reference
const adminUser = db.users.findOne({ role: { $in: ["admin", "director", "administrator"] } });

if (!adminUser) {
  print("No admin user found to use as a reference. Please create an admin user first.");
  quit();
}

print(`Using admin user ${adminUser.firstName} ${adminUser.lastName} (${adminUser._id}) as reference`);

// Fix each document
let fixedCount = 0;
documentsToFix.forEach(doc => {
  try {
    // Update document with proper references
    const result = db.documents.updateOne(
      { _id: doc._id },
      { 
        $set: { 
          uploadedBy: adminUser._id,
          userId: adminUser._id,
          title: doc.title || "Unknown Document",
          name: doc.name || doc.title || "Unknown Document",
          status: doc.status || "pending",
          securityClassification: doc.securityClassification || "Unclassified",
          type: doc.type || "other",
          version: doc.version || 1,
          createdAt: doc.createdAt || new Date(),
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      fixedCount++;
      print(`Fixed document ${doc._id}`);
    }
  } catch (e) {
    print(`Error fixing document ${doc._id}: ${e.message}`);
  }
});

print(`\nFixed ${fixedCount} documents`);

// Verify fix worked
const remainingBadDocs = db.documents.find({
  $or: [
    { uploadedBy: { $exists: false } },
    { uploadedBy: null },
    { uploadedBy: "current_user" },
    { uploadedBy: "undefined" }
  ]
}).count();

print(`Remaining documents with issues: ${remainingBadDocs}`);

// Test population again
print("\nTesting document population after fix:");
const populatedDocs = db.documents.aggregate([
  { $match: { _id: documentsToFix[0]._id } },
  {
    $lookup: {
      from: "users",
      localField: "uploadedBy",
      foreignField: "_id",
      as: "userInfo"
    }
  }
]).toArray();

if (populatedDocs.length > 0) {
  const doc = populatedDocs[0];
  print(`Document ID: ${doc._id}`);
  print(`Name: ${doc.name}`);
  print(`UploadedBy: ${doc.uploadedBy}`);
  
  if (doc.userInfo && doc.userInfo.length > 0) {
    print(`User found: ${doc.userInfo[0].firstName} ${doc.userInfo[0].lastName}`);
    print(`Service ID: ${doc.userInfo[0].serviceId}`);
    print(`Company: ${doc.userInfo[0].company || 'Not specified'}`);
    print("\nFix successful!");
  } else {
    print("No user information found. Fix failed.");
  }
} 