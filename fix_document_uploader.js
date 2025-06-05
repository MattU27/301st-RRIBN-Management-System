// MongoDB script to fix document uploader information
// This script updates documents where John Matthew Banto's documents are incorrectly showing Javier Velasco as the uploader

// Connect to the database
db = db.getSiblingDB("afp_personnel_db");

// Find John Matthew Banto's correct ID and information
var johnMatthewBanto = db.personnels.findOne({ email: "banto@mil.ph" });
var johnMatthewBantoId = johnMatthewBanto ? johnMatthewBanto._id.toString() : "68063c32bb93f9ffb2000000";

// Print John Matthew Banto's information
print("John Matthew Banto's ID: " + johnMatthewBantoId);
print("John Matthew Banto's Info: " + JSON.stringify(johnMatthewBanto));

// Find Javier Velasco's ID
var javierVelasco = db.personnels.findOne({ email: "javier.velasco@mil.ph" });
var javierVelascoId = javierVelasco ? javierVelasco._id.toString() : "680644b64c09aeb74f457347";

print("Javier Velasco's ID: " + javierVelascoId);

// Find all documents
var documents = db.documents.find().toArray();
print("Found " + documents.length + " documents to check");

var updatedCount = 0;

// Create the correct uploader information for John Matthew Banto
var correctUploaderInfo = {
  _id: johnMatthewBantoId,
  firstName: johnMatthewBanto.firstName || "John Matthew",
  lastName: johnMatthewBanto.lastName || "Banto",
  serviceId: johnMatthewBanto.serviceNumber || "2019-10180",
  company: johnMatthewBanto.company || "Alpha",
  rank: johnMatthewBanto.rank || "Private"
};

// Process each document
documents.forEach(function(doc) {
  var needsUpdate = false;
  var updates = {};
  
  // Case 1: Document has Javier Velasco's ID but John Matthew Banto's name
  if (doc.userId === javierVelascoId && 
      doc.uploadedBy && 
      doc.uploadedBy.firstName === "John Matthew" && 
      doc.uploadedBy.lastName === "Banto") {
    
    print("Found document with Javier's ID but John Matthew's name: " + doc._id);
    needsUpdate = true;
    updates.userId = johnMatthewBantoId;
    updates.uploadedBy = correctUploaderInfo;
  }
  
  // Case 2: Document has John Matthew Banto's name but incorrect service number or company
  else if (doc.uploadedBy && 
           doc.uploadedBy.firstName === "John Matthew" && 
           doc.uploadedBy.lastName === "Banto" &&
           (doc.uploadedBy.serviceId !== "2019-10180" || doc.uploadedBy.company !== "Alpha")) {
    
    print("Found document with John Matthew's name but incorrect details: " + doc._id);
    needsUpdate = true;
    updates.userId = johnMatthewBantoId;
    updates.uploadedBy = correctUploaderInfo;
  }
  
  // Case 3: Document has uploadedBy._id that doesn't match userId
  else if (doc.uploadedBy && 
           doc.uploadedBy._id && 
           doc.userId && 
           doc.userId.toString() !== doc.uploadedBy._id.toString()) {
    
    print("Found document with mismatched userId and uploadedBy._id: " + doc._id);
    
    // If this is John Matthew's document, fix it
    if (doc.uploadedBy.firstName === "John Matthew" && doc.uploadedBy.lastName === "Banto") {
      needsUpdate = true;
      updates.userId = johnMatthewBantoId;
      updates.uploadedBy = correctUploaderInfo;
    }
    // Otherwise use the uploadedBy._id as the source of truth
    else {
      needsUpdate = true;
      updates.userId = doc.uploadedBy._id.toString();
    }
  }
  
  // Update the document if needed
  if (needsUpdate) {
    print("Updating document: " + doc._id);
    print("  Before: userId=" + doc.userId + ", uploadedBy=" + JSON.stringify(doc.uploadedBy));
    print("  After: userId=" + updates.userId + ", uploadedBy=" + JSON.stringify(updates.uploadedBy || doc.uploadedBy));
    
    db.documents.updateOne(
      { _id: doc._id },
      { $set: updates }
    );
    updatedCount++;
  }
});

print("Updated " + updatedCount + " documents");

// Verify the changes
print("\nVerifying changes...");
var johnMatthewDocs = db.documents.find({
  $or: [
    { userId: johnMatthewBantoId },
    { "uploadedBy.firstName": "John Matthew", "uploadedBy.lastName": "Banto" }
  ]
}).toArray();

print("Found " + johnMatthewDocs.length + " documents for John Matthew Banto");
johnMatthewDocs.forEach(function(doc) {
  print("Document: " + doc._id);
  print("  userId: " + doc.userId);
  print("  uploadedBy: " + JSON.stringify(doc.uploadedBy));
}); 