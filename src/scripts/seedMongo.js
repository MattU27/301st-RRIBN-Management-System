// MongoDB seeding script
// Run with: mongosh localhost:27017/afp_personnel_db src/scripts/seedMongo.js

// Define enums
const UserRole = {
  RESERVIST: 'reservist',
  ENLISTED: 'enlisted',
  STAFF: 'staff',
  ADMIN: 'admin',
  DIRECTOR: 'director',
};

const UserStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive',
  RETIRED: 'retired',
  STANDBY: 'standby',
  READY: 'ready',
};

const MilitaryRank = {
  PRIVATE: 'Private',
  PFC: 'Private First Class',
  CORPORAL: 'Corporal',
  SERGEANT: 'Sergeant',
  SECOND_LIEUTENANT: 'Second Lieutenant',
  FIRST_LIEUTENANT: 'First Lieutenant',
  CAPTAIN: 'Captain',
  MAJOR: 'Major',
  LIEUTENANT_COLONEL: 'Lieutenant Colonel',
  COLONEL: 'Colonel',
  BRIGADIER_GENERAL: 'Brigadier General',
  MAJOR_GENERAL: 'Major General',
  LIEUTENANT_GENERAL: 'Lieutenant General',
  GENERAL: 'General',
};

const Company = {
  ALPHA: 'Alpha',
  BRAVO: 'Bravo',
  CHARLIE: 'Charlie',
  HQ: 'Headquarters',
  SIGNAL: 'Signal',
  FAB: 'Forward Air Base',
};

const DocumentStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const DocumentType = {
  TRAINING_CERTIFICATE: 'training_certificate',
  MEDICAL_RECORD: 'medical_record',
  IDENTIFICATION: 'identification',
  PROMOTION: 'promotion',
  COMMENDATION: 'commendation',
  OTHER: 'other',
};

const TrainingStatus = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const TrainingType = {
  FIELD_EXERCISE: 'field_exercise',
  CLASSROOM: 'classroom',
  ONLINE: 'online',
  SEMINAR: 'seminar',
  WORKSHOP: 'workshop',
  COMBAT_DRILL: 'combat_drill',
  MEDICAL: 'medical',
  TECHNICAL: 'technical',
  LEADERSHIP: 'leadership',
  OTHER: 'other',
};

// Connect to database
print("Connected to the AFP Personnel Database");

// Clear existing collections
db.users.drop();
db.documents.drop();
db.trainings.drop();
print("Cleared existing collections");

// Create users
print("Creating users...");
const users = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG', // Password123 hashed
    role: UserRole.DIRECTOR,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG', // Password123 hashed
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@example.com',
    password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG', // Password123 hashed
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@example.com',
    password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG', // Password123 hashed
    role: UserRole.RESERVIST,
    status: UserStatus.ACTIVE,
    rank: MilitaryRank.SERGEANT,
    company: Company.ALPHA,
    contactNumber: '+1234567890',
    dateOfBirth: new Date('1990-05-15'),
    address: {
      street: '123 Main St',
      city: 'Makati',
      province: 'Metro Manila',
      postalCode: '1200',
    },
    emergencyContact: {
      name: 'Sarah Brown',
      relationship: 'Spouse',
      contactNumber: '+1987654321',
    },
    specializations: ['Combat Medic', 'Radio Operations'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG', // Password123 hashed
    role: UserRole.ENLISTED,
    status: UserStatus.ACTIVE,
    rank: MilitaryRank.CORPORAL,
    company: Company.BRAVO,
    contactNumber: '+1234567891',
    dateOfBirth: new Date('1992-03-22'),
    address: {
      street: '456 Oak St',
      city: 'Makati',
      province: 'Metro Manila',
      postalCode: '1200',
    },
    specializations: ['Infantry', 'Reconnaissance'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@example.com',
    password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG', // Password123 hashed
    role: UserRole.RESERVIST,
    status: UserStatus.READY,
    rank: MilitaryRank.PRIVATE,
    company: Company.CHARLIE,
    contactNumber: '+1234567892',
    dateOfBirth: new Date('1995-07-10'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    firstName: 'James',
    lastName: 'Miller',
    email: 'james.miller@example.com',
    password: '$2a$10$XHvGKgAFrZ2evFwGSoXVzea6h8fI0NdljPNSmEY56LFwow/6XEwfG', // Password123 hashed
    role: UserRole.RESERVIST,
    status: UserStatus.STANDBY,
    rank: MilitaryRank.FIRST_LIEUTENANT,
    company: Company.HQ,
    contactNumber: '+1234567893',
    dateOfBirth: new Date('1988-09-30'),
    specializations: ['Communications', 'Logistics'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const userIds = [];
users.forEach(user => {
  const result = db.users.insertOne(user);
  userIds.push(result.insertedId);
});
print(`Created ${userIds.length} users`);

// Create documents
print("Creating documents...");
const documents = [
  {
    title: 'Medical Clearance',
    description: 'Annual medical clearance certificate',
    type: DocumentType.MEDICAL_RECORD,
    fileUrl: 'https://example.com/documents/medical-clearance-001.pdf',
    fileName: 'medical-clearance-001.pdf',
    fileSize: 1024 * 1024, // 1MB
    mimeType: 'application/pdf',
    userId: userIds[3], // Michael Brown
    uploadedBy: userIds[3], // Self-uploaded
    status: DocumentStatus.APPROVED,
    verifiedBy: userIds[2], // Robert Johnson (Staff)
    verificationDate: new Date(),
    issuedBy: 'AFP Medical Center',
    issuedDate: new Date('2023-01-15'),
    expirationDate: new Date('2024-01-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Training Certificate - Basic Combat',
    description: 'Certificate of completion for Basic Combat Training',
    type: DocumentType.TRAINING_CERTIFICATE,
    fileUrl: 'https://example.com/documents/training-cert-001.pdf',
    fileName: 'training-cert-001.pdf',
    fileSize: 2 * 1024 * 1024, // 2MB
    mimeType: 'application/pdf',
    userId: userIds[3], // Michael Brown
    uploadedBy: userIds[3], // Self-uploaded
    status: DocumentStatus.APPROVED,
    verifiedBy: userIds[2], // Robert Johnson (Staff)
    verificationDate: new Date(),
    issuedBy: 'AFP Training Command',
    issuedDate: new Date('2022-06-20'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Military ID',
    description: 'Military identification card',
    type: DocumentType.IDENTIFICATION,
    fileUrl: 'https://example.com/documents/military-id-001.jpg',
    fileName: 'military-id-001.jpg',
    fileSize: 500 * 1024, // 500KB
    mimeType: 'image/jpeg',
    userId: userIds[4], // David Wilson
    uploadedBy: userIds[4], // Self-uploaded
    status: DocumentStatus.PENDING,
    issuedBy: 'AFP Personnel Division',
    issuedDate: new Date('2022-01-10'),
    expirationDate: new Date('2027-01-10'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Commendation Letter',
    description: 'Letter of commendation for exceptional service',
    type: DocumentType.COMMENDATION,
    fileUrl: 'https://example.com/documents/commendation-001.pdf',
    fileName: 'commendation-001.pdf',
    fileSize: 1.5 * 1024 * 1024, // 1.5MB
    mimeType: 'application/pdf',
    userId: userIds[6], // James Miller
    uploadedBy: userIds[2], // Robert Johnson (Staff)
    status: DocumentStatus.APPROVED,
    verifiedBy: userIds[1], // Jane Smith (Admin)
    verificationDate: new Date(),
    issuedBy: 'Commanding Officer, HQ Company',
    issuedDate: new Date('2023-05-05'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

db.documents.insertMany(documents);
print(`Created ${documents.length} documents`);

// Calculate dates for upcoming training
const now = new Date();
const twoWeeksFromNow = new Date(now);
twoWeeksFromNow.setDate(now.getDate() + 14);

const sixteenDaysFromNow = new Date(now);
sixteenDaysFromNow.setDate(now.getDate() + 16);

// Create trainings
print("Creating trainings...");
const trainings = [
  {
    title: 'Advanced Combat Training',
    description: 'Intensive training for advanced combat techniques and strategies',
    type: TrainingType.FIELD_EXERCISE,
    startDate: new Date('2023-06-15'),
    endDate: new Date('2023-06-30'),
    location: {
      name: 'AFP Training Grounds',
      address: 'Camp General Emilio Aguinaldo, Quezon City',
      coordinates: {
        latitude: 14.6091,
        longitude: 121.0509,
      },
    },
    instructor: {
      name: 'Col. James Rodriguez',
      rank: 'Colonel',
      specialization: 'Tactical Operations',
      contactInfo: 'j.rodriguez@afp.mil.ph',
    },
    status: TrainingStatus.COMPLETED,
    capacity: 50,
    eligibleRanks: [
      MilitaryRank.PRIVATE,
      MilitaryRank.PFC,
      MilitaryRank.CORPORAL,
      MilitaryRank.SERGEANT,
    ],
    eligibleCompanies: [Company.ALPHA, Company.BRAVO, Company.CHARLIE],
    mandatory: true,
    attendees: [
      {
        userId: userIds[3], // Michael Brown
        status: 'completed',
        registrationDate: new Date('2023-05-20'),
        completionDate: new Date('2023-06-30'),
        certificateUrl: 'https://example.com/certificates/act-001.pdf',
        performance: {
          score: 92,
          notes: 'Excellent performance in tactical exercises',
        },
      },
      {
        userId: userIds[4], // David Wilson
        status: 'completed',
        registrationDate: new Date('2023-05-22'),
        completionDate: new Date('2023-06-30'),
        certificateUrl: 'https://example.com/certificates/act-002.pdf',
        performance: {
          score: 88,
          notes: 'Good performance, needs improvement in night operations',
        },
      },
    ],
    createdBy: userIds[2], // Robert Johnson (Staff)
    updatedBy: userIds[2],
    tags: ['combat', 'tactical', 'advanced'],
    certificationOffered: true,
    certificationValidityPeriod: 24, // 2 years
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'First Aid and Field Medicine',
    description: 'Training on emergency medical procedures in field conditions',
    type: TrainingType.WORKSHOP,
    startDate: new Date('2023-08-10'),
    endDate: new Date('2023-08-12'),
    location: {
      name: 'AFP Medical Center',
      address: 'V. Luna Road, Quezon City',
      coordinates: {
        latitude: 14.6332,
        longitude: 121.0539,
      },
    },
    instructor: {
      name: 'Maj. Elena Santos',
      rank: 'Major',
      specialization: 'Field Medicine',
      contactInfo: 'e.santos@afp.mil.ph',
    },
    status: TrainingStatus.COMPLETED,
    capacity: 30,
    eligibleRanks: Object.values(MilitaryRank),
    eligibleCompanies: Object.values(Company),
    mandatory: false,
    attendees: [
      {
        userId: userIds[3], // Michael Brown
        status: 'completed',
        registrationDate: new Date('2023-07-15'),
        completionDate: new Date('2023-08-12'),
        certificateUrl: 'https://example.com/certificates/fafm-001.pdf',
        performance: {
          score: 95,
          notes: 'Outstanding performance, especially in emergency response scenarios',
        },
      },
    ],
    createdBy: userIds[1], // Jane Smith (Admin)
    updatedBy: userIds[1],
    tags: ['medical', 'first aid', 'emergency'],
    certificationOffered: true,
    certificationValidityPeriod: 12, // 1 year
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Leadership and Command Principles',
    description: 'Training for officers and NCOs on leadership and command principles',
    type: TrainingType.LEADERSHIP,
    startDate: new Date('2023-09-05'),
    endDate: new Date('2023-09-10'),
    location: {
      name: 'AFP Command and Leadership Center',
      address: 'Camp General Emilio Aguinaldo, Quezon City',
      coordinates: {
        latitude: 14.6095,
        longitude: 121.0512,
      },
    },
    instructor: {
      name: 'Gen. Antonio Reyes',
      rank: 'General',
      specialization: 'Strategic Leadership',
      contactInfo: 'a.reyes@afp.mil.ph',
    },
    status: TrainingStatus.COMPLETED,
    capacity: 20,
    eligibleRanks: [
      MilitaryRank.SERGEANT,
      MilitaryRank.SECOND_LIEUTENANT,
      MilitaryRank.FIRST_LIEUTENANT,
      MilitaryRank.CAPTAIN,
      MilitaryRank.MAJOR,
    ],
    mandatory: false,
    attendees: [
      {
        userId: userIds[6], // James Miller
        status: 'completed',
        registrationDate: new Date('2023-08-01'),
        completionDate: new Date('2023-09-10'),
        certificateUrl: 'https://example.com/certificates/lcp-001.pdf',
        performance: {
          score: 90,
          notes: 'Very good performance, shows strong leadership potential',
        },
      },
    ],
    createdBy: userIds[1], // Jane Smith (Admin)
    updatedBy: userIds[0], // John Doe (Director)
    tags: ['leadership', 'command', 'strategy'],
    certificationOffered: true,
    certificationValidityPeriod: 36, // 3 years
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: 'Cyber Security for Military Operations',
    description: 'Training on cybersecurity principles and practices for military operations',
    type: TrainingType.TECHNICAL,
    startDate: twoWeeksFromNow,
    endDate: sixteenDaysFromNow,
    location: {
      name: 'AFP Signal Battalion HQ',
      address: 'Camp General Emilio Aguinaldo, Quezon City',
      coordinates: {
        latitude: 14.6100,
        longitude: 121.0520,
      },
    },
    instructor: {
      name: 'Capt. Diego Cruz',
      rank: 'Captain',
      specialization: 'Cyber Security',
      contactInfo: 'd.cruz@afp.mil.ph',
    },
    status: TrainingStatus.UPCOMING,
    capacity: 25,
    eligibleRanks: Object.values(MilitaryRank),
    eligibleCompanies: [Company.HQ, Company.SIGNAL],
    mandatory: false,
    virtualMeetingUrl: 'https://afp-meet.example.com/cyber-training',
    materials: [
      {
        title: 'Cyber Security Basics Handbook',
        fileUrl: 'https://example.com/materials/cyber-basics.pdf',
        fileType: 'application/pdf',
      },
      {
        title: 'Threat Assessment Worksheet',
        fileUrl: 'https://example.com/materials/threat-assessment.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
    attendees: [
      {
        userId: userIds[6], // James Miller
        status: 'registered',
        registrationDate: new Date(),
      },
    ],
    createdBy: userIds[2], // Robert Johnson (Staff)
    tags: ['cyber', 'security', 'technical'],
    certificationOffered: true,
    certificationValidityPeriod: 12, // 1 year
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

db.trainings.insertMany(trainings);
print(`Created ${trainings.length} trainings`);

print("Database seeded successfully!");

// Create indexes for better query performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });
db.users.createIndex({ company: 1 });

db.documents.createIndex({ userId: 1 });
db.documents.createIndex({ status: 1 });
db.documents.createIndex({ type: 1 });

db.trainings.createIndex({ startDate: 1 });
db.trainings.createIndex({ status: 1 });
db.trainings.createIndex({ "attendees.userId": 1 });

print("Created indexes for better performance"); 