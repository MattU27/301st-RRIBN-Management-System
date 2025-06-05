// MongoDB script to fix document uploader information - Version 2
// Run this script with: mongo mongodb://localhost:27017/afp_personnel_db fix_document_uploaders_v2.js

// Connect to the database
db = db.getSiblingDB("afp_personnel_db");

print("Starting document uploader information fix (v2)...");

// Get all documents
var documents = db.documents.find().toArray();
print("Found " + documents.length + " documents to check");

// John Matthew Banto's ID that was incorrectly used
var johnMatthewBantoId = "68063c32bb93f9ffb2000000";

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
    
    // Case 1: Document has John Matthew Banto as userId but someone else's name in uploadedBy
    if (userId === johnMatthewBantoId && 
        uploadedBy && 
        typeof uploadedBy === 'object' && 
        uploadedBy.firstName && 
        uploadedBy.lastName && 
        (uploadedBy.firstName !== "John Matthew" || uploadedBy.lastName !== "Banto")) {
      
      print("Document " + docId + " has John Matthew Banto's ID but different name in uploadedBy");
      needsUpdate = true;
      
      // Try to find the correct user based on uploadedBy information
      var user = null;
      
      // Try to find by name
      if (uploadedBy.firstName && uploadedBy.lastName) {
        user = db.users.findOne({
          firstName: uploadedBy.firstName,
          lastName: uploadedBy.lastName
        });
        
        if (user) {
          print("Found user by name: " + user.firstName + " " + user.lastName);
        }
      }
      
      // If not found by name, try by service number
      if (!user && uploadedBy.serviceId) {
        user = db.users.findOne({
          serviceNumber: uploadedBy.serviceId
        });
        
        if (user) {
          print("Found user by service number: " + user.serviceNumber);
        }
      }
      
      // If we found the correct user, update the document
      if (user) {
        var correctUserId = user._id.toString();
        updateData.userId = correctUserId;
        updateData.uploadedBy = {
          _id: correctUserId,
          firstName: user.firstName || uploadedBy.firstName,
          lastName: user.lastName || uploadedBy.lastName,
          serviceId: user.serviceNumber || uploadedBy.serviceId || "",
          company: user.company || uploadedBy.company || "",
          rank: user.rank || uploadedBy.rank || ""
        };
        print("Will update document to use correct user: " + user.firstName + " " + user.lastName);
      }
    }
    // Case 2: Document has John Matthew Banto's information but was uploaded by someone else
    else if ((userId === johnMatthewBantoId || 
             (uploadedBy && 
              typeof uploadedBy === 'object' && 
              uploadedBy._id === johnMatthewBantoId)) && 
             doc.createdBy && 
             doc.createdBy !== johnMatthewBantoId) {
      
      print("Document " + docId + " has John Matthew Banto's ID but was created by someone else");
      needsUpdate = true;
      
      // Try to find the correct user based on createdBy
      var user = db.users.findOne({_id: (typeof doc.createdBy === 'string') ? ObjectId(doc.createdBy) : doc.createdBy});
      
      if (user) {
        var correctUserId = user._id.toString();
        updateData.userId = correctUserId;
        updateData.uploadedBy = {
          _id: correctUserId,
          firstName: user.firstName || "Unknown",
          lastName: user.lastName || "User",
          serviceId: user.serviceNumber || "",
          company: user.company || "",
          rank: user.rank || ""
        };
        print("Will update document to use creator: " + user.firstName + " " + user.lastName);
      }
    }
    // Case 3: Document has uploadedBy with John Matthew Banto's name but a different userId
    else if (uploadedBy && 
             typeof uploadedBy === 'object' && 
             uploadedBy.firstName === "John Matthew" && 
             uploadedBy.lastName === "Banto" && 
             userId && 
             userId !== johnMatthewBantoId) {
      
      print("Document " + docId + " has John Matthew Banto's name but different userId");
      needsUpdate = true;
      
      // Try to find the correct user based on userId
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
        print("Will update document to use correct user info: " + user.firstName + " " + user.lastName);
      }
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

// Final step: Find any remaining documents with John Matthew Banto's ID and set them to unknown user
// if they don't actually belong to him
var remainingDocs = db.documents.find({
  $or: [
    {userId: johnMatthewBantoId},
    {"uploadedBy._id": johnMatthewBantoId}
  ]
}).toArray();

if (remainingDocs.length > 0) {
  print("Found " + remainingDocs.length + " documents still using John Matthew Banto's ID");
  
  // Check if these documents actually belong to John Matthew Banto
  var johnMatthewBanto = db.users.findOne({
    $or: [
      {_id: ObjectId(johnMatthewBantoId)},
      {firstName: "John Matthew", lastName: "Banto"}
    ]
  });
  
  if (!johnMatthewBanto) {
    print("John Matthew Banto not found in users collection");
    
    // Generate a unique ID for unknown user
    var unknownUserId = "unknown_user_" + new Date().getTime();
    
    // Update all remaining documents to use unknown user
    var result = db.documents.updateMany(
      {
        $or: [
          {userId: johnMatthewBantoId},
          {"uploadedBy._id": johnMatthewBantoId}
        ]
      },
      {
        $set: {
          userId: unknownUserId,
          uploadedBy: {
            _id: unknownUserId,
            firstName: "Unknown",
            lastName: "User",
            serviceId: "",
            company: "",
            rank: ""
          }
        }
      }
    );
    
    print("Updated " + result.modifiedCount + " documents to use unknown user");
    updatedCount += result.modifiedCount;
  } else {
    print("John Matthew Banto found in users collection - keeping his documents as is");
  }
}

print("Fix completed.");
print("Total documents processed: " + documents.length);
print("Documents updated: " + updatedCount);
print("Errors encountered: " + errorCount); 