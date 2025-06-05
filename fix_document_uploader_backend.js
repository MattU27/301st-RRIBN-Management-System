// MongoDB script to fix document uploader information on the backend
// This script updates documents to ensure they have the correct user information

// Connect to the database
db = db.getSiblingDB("afp_personnel_db");

// Find John Matthew Banto's correct information
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
print("Found " + documents.length + " documents to process");

var updatedCount = 0;

// Process each document
documents.forEach(function(doc) {
  var needsUpdate = false;
  var updateData = {};
  
  // Case 1: Document has Javier Velasco's ID but John Matthew Banto's name
  if (doc.userId && doc.userId.toString() === javierVelascoId && 
      doc.uploadedBy && doc.uploadedBy.firstName === "John Matthew" && doc.uploadedBy.lastName === "Banto") {
    print("Document " + doc._id + " has Javier's ID but John Matthew's name");
    needsUpdate = true;
    updateData.userId = johnMatthewBantoId;
    updateData.uploadedBy = {
      _id: johnMatthewBantoId,
      firstName: "John Matthew",
      lastName: "Banto",
      serviceId: "2019-10180",
      company: "Alpha",
      rank: "Private"
    };
  }
  
  // Case 2: Document has John Matthew Banto's name but incorrect service ID or company
  else if (doc.uploadedBy && doc.uploadedBy.firstName === "John Matthew" && doc.uploadedBy.lastName === "Banto" &&
          (doc.uploadedBy.serviceId !== "2019-10180" || doc.uploadedBy.company !== "Alpha")) {
    print("Document " + doc._id + " has John Matthew's name but incorrect details");
    needsUpdate = true;
    updateData.userId = johnMatthewBantoId;
    updateData.uploadedBy = {
      _id: johnMatthewBantoId,
      firstName: "John Matthew",
      lastName: "Banto",
      serviceId: "2019-10180",
      company: "Alpha",
      rank: "Private"
    };
  }
  
  // Case 3: Document has string uploadedBy instead of object
  else if (typeof doc.uploadedBy === "string") {
    print("Document " + doc._id + " has string uploadedBy: " + doc.uploadedBy);
    needsUpdate = true;
    updateData.userId = johnMatthewBantoId;
    updateData.uploadedBy = {
      _id: johnMatthewBantoId,
      firstName: "John Matthew",
      lastName: "Banto",
      serviceId: "2019-10180",
      company: "Alpha",
      rank: "Private"
    };
  }
  
  // Case 4: Document has userId that doesn't match uploadedBy._id
  else if (doc.userId && doc.uploadedBy && doc.uploadedBy._id && 
          doc.userId.toString() !== doc.uploadedBy._id.toString()) {
    print("Document " + doc._id + " has mismatched userId and uploadedBy._id");
    needsUpdate = true;
    // Use the uploadedBy information as the source of truth
    updateData.userId = doc.uploadedBy._id.toString();
  }
  
  // Update the document if needed
  if (needsUpdate) {
    print("Updating document: " + doc._id);
    db.documents.updateOne(
      { _id: doc._id },
      { $set: updateData }
    );
    updatedCount++;
  }
});

print("Updated " + updatedCount + " documents");

// Verify the fix
var johnMatthewDocs = db.documents.find({
  $or: [
    { "uploadedBy.firstName": "John Matthew", "uploadedBy.lastName": "Banto" },
    { userId: johnMatthewBantoId }
  ]
}).toArray();

print("After fix: Found " + johnMatthewDocs.length + " documents belonging to John Matthew Banto");

// Print summary of the first document as verification
if (johnMatthewDocs.length > 0) {
  var sampleDoc = johnMatthewDocs[0];
  print("Sample document:");
  print("  ID: " + sampleDoc._id);
  print("  userId: " + sampleDoc.userId);
  print("  uploadedBy._id: " + (sampleDoc.uploadedBy ? sampleDoc.uploadedBy._id : "N/A"));
  print("  uploadedBy.firstName: " + (sampleDoc.uploadedBy ? sampleDoc.uploadedBy.firstName : "N/A"));
  print("  uploadedBy.lastName: " + (sampleDoc.uploadedBy ? sampleDoc.uploadedBy.lastName : "N/A"));
  print("  uploadedBy.serviceId: " + (sampleDoc.uploadedBy ? sampleDoc.uploadedBy.serviceId : "N/A"));
  print("  uploadedBy.company: " + (sampleDoc.uploadedBy ? sampleDoc.uploadedBy.company : "N/A"));
} 