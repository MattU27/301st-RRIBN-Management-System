// Script to seed the database with sample documents
// Run with: mongosh "mongodb://localhost:27017/afp_personnel_db" scripts/seed-documents.js

// First, let's find some users to associate with documents
const users = db.users.find({}, { _id: 1, firstName: 1, lastName: 1, serviceId: 1, company: 1 }).limit(5).toArray();

if (users.length === 0) {
  print("No users found in the database. Please add users first.");
  quit();
}

// Sample document types
const documentTypes = [
  'training_certificate',
  'medical_record',
  'identification',
  'promotion',
  'commendation',
  'other'
];

// Sample security classifications
const securityClassifications = [
  'Unclassified',
  'Confidential',
  'Secret',
  'Top Secret'
];

// Sample document names
const documentNames = [
  'Training Certificate - Basic Combat',
  'Medical Examination Report',
  'Military ID Card',
  'Promotion Order',
  'Certificate of Commendation',
  'Personal Information Form',
  'Educational Background',
  'Service Record',
  'Annual Physical Fitness Test Results',
  'Marksmanship Qualification'
];

// Sample document descriptions
const documentDescriptions = [
  'Certificate of completion for basic combat training',
  'Annual medical examination report',
  'Military identification card',
  'Official promotion order',
  'Certificate of commendation for outstanding service',
  'Personal information form with contact details',
  'Educational background and qualifications',
  'Record of military service',
  'Results of annual physical fitness test',
  'Marksmanship qualification certificate'
];

// Create sample documents
const sampleDocuments = [];

// Create 2-3 documents for each user
users.forEach(user => {
  const numDocs = Math.floor(Math.random() * 2) + 2; // 2-3 documents per user
  
  for (let i = 0; i < numDocs; i++) {
    const docTypeIndex = Math.floor(Math.random() * documentTypes.length);
    const nameIndex = Math.floor(Math.random() * documentNames.length);
    const descIndex = Math.floor(Math.random() * documentDescriptions.length);
    const securityIndex = Math.floor(Math.random() * securityClassifications.length);
    
    // Random status (more pending than others for testing)
    const statusRoll = Math.random();
    let status;
    if (statusRoll < 0.5) {
      status = 'pending';
    } else if (statusRoll < 0.8) {
      status = 'verified';
    } else {
      status = 'rejected';
    }
    
    // Create a document
    const doc = {
      title: documentNames[nameIndex],
      name: documentNames[nameIndex],
      description: documentDescriptions[descIndex],
      type: documentTypes[docTypeIndex],
      fileUrl: `/uploads/documents/sample_${i + 1}.pdf`,
      fileName: `sample_${i + 1}.pdf`,
      fileSize: Math.floor(Math.random() * 1000000) + 100000, // 100KB - 1MB
      mimeType: 'application/pdf',
      userId: user._id,
      uploadedBy: user._id, // Reference to the user
      status: status,
      uploadDate: new Date(),
      securityClassification: securityClassifications[securityIndex],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add verification details for verified documents
    if (status === 'verified') {
      // Find a staff/admin user to be the verifier
      const verifiers = db.users.find({ role: { $in: ['staff', 'admin', 'director'] } }).limit(1).toArray();
      if (verifiers.length > 0) {
        doc.verifiedBy = verifiers[0]._id;
        doc.verifiedDate = new Date();
      }
    }
    
    // Add rejection comments for rejected documents
    if (status === 'rejected') {
      doc.comments = 'Document needs to be resubmitted with clearer information.';
    }
    
    sampleDocuments.push(doc);
  }
});

// Insert the documents
if (sampleDocuments.length > 0) {
  db.documents.insertMany(sampleDocuments);
  print(`Successfully inserted ${sampleDocuments.length} sample documents.`);
} else {
  print("No documents were created.");
}

// Print a summary of the documents
print("\nDocument Summary:");
print(`Total Documents: ${sampleDocuments.length}`);
const pendingCount = sampleDocuments.filter(doc => doc.status === 'pending').length;
const verifiedCount = sampleDocuments.filter(doc => doc.status === 'verified').length;
const rejectedCount = sampleDocuments.filter(doc => doc.status === 'rejected').length;
print(`Pending: ${pendingCount}, Verified: ${verifiedCount}, Rejected: ${rejectedCount}`);

// Find and print the documents with user information
print("\nSample of documents with user info:");
const samplesWithUsers = db.documents.aggregate([
  { $limit: 3 },
  {
    $lookup: {
      from: "users",
      localField: "uploadedBy",
      foreignField: "_id",
      as: "userInfo"
    }
  },
  { $unwind: "$userInfo" },
  {
    $project: {
      name: 1,
      status: 1,
      "userInfo.firstName": 1,
      "userInfo.lastName": 1,
      "userInfo.serviceId": 1,
      "userInfo.company": 1
    }
  }
]).toArray();

printjson(samplesWithUsers); 