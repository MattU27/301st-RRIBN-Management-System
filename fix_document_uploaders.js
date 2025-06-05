// MongoDB script to fix document uploader information
// Run this script with: mongo mongodb://localhost:27017/afp_personnel_db fix_document_uploaders.js

// Connect to the database
db = db.getSiblingDB("afp_personnel_db");

print("Starting document uploader information fix...");

// Get all documents
var documents = db.documents.find().toArray();
print("Found " + documents.length + " documents to check");

var updatedCount = 0;
var errorCount = 0;

// Process each document
documents.forEach(function(doc) {
  try {
    var docId = doc._id;
    var userId = doc.userId;
    var uploadedBy = doc.uploadedBy;
    var needsUpdate = false;
    var updateData = {};
    
    // Case 1: Document has no uploadedBy field
    if (!uploadedBy) {
      print("Document " + docId + " has no uploadedBy field");
      needsUpdate = true;
      
      // Try to find the user
      var user = db.users.findOne({_id: (typeof userId === 'string') ? ObjectId(userId) : userId});
      
      if (user) {
        updateData.uploadedBy = {
          _id: userId,
          firstName: user.firstName || "Unknown",
          lastName: user.lastName || "User",
          serviceId: user.serviceNumber || "",
          company: user.company || "",
          rank: user.rank || ""
        };
        print("Found user information for " + user.firstName + " " + user.lastName);
      } else {
        print("Could not find user with ID: " + userId);
        // Leave the document as is
        needsUpdate = false;
      }
    }
    // Case 2: uploadedBy is a string (userId)
    else if (typeof uploadedBy === 'string') {
      print("Document " + docId + " has string uploadedBy: " + uploadedBy);
      needsUpdate = true;
      
      // Try to find the user
      var user = db.users.findOne({_id: (typeof uploadedBy === 'string') ? ObjectId(uploadedBy) : uploadedBy});
      
      if (user) {
        updateData.uploadedBy = {
          _id: uploadedBy,
          firstName: user.firstName || "Unknown",
          lastName: user.lastName || "User",
          serviceId: user.serviceNumber || "",
          company: user.company || "",
          rank: user.rank || ""
        };
        // Also update userId to match
        updateData.userId = uploadedBy;
        print("Found user information for " + user.firstName + " " + user.lastName);
      } else {
        print("Could not find user with ID: " + uploadedBy);
        // Leave the document as is
        needsUpdate = false;
      }
    }
    // Case 3: uploadedBy is an object but userId doesn't match uploadedBy._id
    else if (typeof uploadedBy === 'object' && uploadedBy._id && userId && uploadedBy._id.toString() !== userId.toString()) {
      print("Document " + docId + " has inconsistent userId and uploadedBy._id");
      needsUpdate = true;
      
      // Use the uploadedBy._id as the source of truth
      updateData.userId = uploadedBy._id;
      print("Setting userId to match uploadedBy._id: " + uploadedBy._id);
    }
    
    // Update the document if needed
    if (needsUpdate && Object.keys(updateData).length > 0) {
      var result = db.documents.updateOne(
        {_id: docId},
        {$set: updateData}
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        print("Updated document " + docId);
      } else {
        print("Failed to update document " + docId);
      }
    }
  } catch (e) {
    errorCount++;
    print("Error processing document: " + e);
  }
});

print("Fix completed.");
print("Total documents processed: " + documents.length);
print("Documents updated: " + updatedCount);
print("Errors encountered: " + errorCount); 