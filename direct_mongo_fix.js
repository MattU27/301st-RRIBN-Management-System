// Direct MongoDB fix script
// This script directly updates all documents in the database to use John Matthew Banto's correct information

// Connect to the database
db = db.getSiblingDB("afp_personnel_db");

// John Matthew Banto's correct information
var johnMatthewBantoId = "68063c32bb93f9ffb2000000";
var johnMatthewBantoInfo = {
  "_id": johnMatthewBantoId,
  "firstName": "John Matthew",
  "lastName": "Banto",
  "serviceId": "2019-10180",
  "company": "Alpha",
  "rank": "Private"
};

print("Directly updating all documents to use John Matthew Banto's correct information");

// Update all documents in the collection
var result = db.documents.updateMany(
  {}, // Match all documents
  {
    $set: {
      "userId": johnMatthewBantoId,
      "uploadedBy": johnMatthewBantoInfo
    }
  }
);

print("Updated " + result.modifiedCount + " documents");

// Verify the update
var docs = db.documents.find().toArray();
print("Total documents in collection: " + docs.length);

// Print the first document as a sample
if (docs.length > 0) {
  var sample = docs[0];
  print("Sample document:");
  print("  ID: " + sample._id);
  print("  Title: " + sample.title);
  print("  userId: " + sample.userId);
  print("  uploadedBy._id: " + sample.uploadedBy._id);
  print("  uploadedBy.firstName: " + sample.uploadedBy.firstName);
  print("  uploadedBy.lastName: " + sample.uploadedBy.lastName);
  print("  uploadedBy.serviceId: " + sample.uploadedBy.serviceId);
  print("  uploadedBy.company: " + sample.uploadedBy.company);
}

print("Fix completed. All documents now use John Matthew Banto's correct information."); 