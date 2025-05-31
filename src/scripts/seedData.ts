import { dbConnect } from '../utils/dbConnect';
import User, { UserRole, UserStatus, MilitaryRank, Company } from '../models/User';
import Document, { DocumentType, DocumentStatus } from '../models/Document';
import Training, { TrainingType, TrainingStatus } from '../models/Training';
import { ObjectId } from 'mongodb';

// Connect to MongoDB
async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await dbConnect();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Document.deleteMany({});
    await Training.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    console.log('Creating users...');
    const users = await User.create([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123',
        role: UserRole.DIRECTOR,
        status: UserStatus.ACTIVE,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'Password123',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@example.com',
        password: 'Password123',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        password: 'Password123',
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
      },
      {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@example.com',
        password: 'Password123',
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
      },
      {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@example.com',
        password: 'Password123',
        role: UserRole.RESERVIST,
        status: UserStatus.READY,
        rank: MilitaryRank.PRIVATE,
        company: Company.CHARLIE,
        contactNumber: '+1234567892',
        dateOfBirth: new Date('1995-07-10'),
      },
      {
        firstName: 'James',
        lastName: 'Miller',
        email: 'james.miller@example.com',
        password: 'Password123',
        role: UserRole.RESERVIST,
        status: UserStatus.STANDBY,
        rank: MilitaryRank.FIRST_LIEUTENANT,
        company: Company.HQ,
        contactNumber: '+1234567893',
        dateOfBirth: new Date('1988-09-30'),
        specializations: ['Communications', 'Logistics'],
      },
    ]);
    console.log(`Created ${users.length} users`);

    // Create documents
    console.log('Creating documents...');
    const documents = await Document.create([
      {
        title: 'Medical Clearance',
        description: 'Annual medical clearance certificate',
        type: DocumentType.MEDICAL_RECORD,
        fileUrl: 'https://example.com/documents/medical-clearance-001.pdf',
        fileName: 'medical-clearance-001.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        userId: users[3]._id, // Michael Brown
        uploadedBy: users[3]._id, // Self-uploaded
        status: DocumentStatus.APPROVED,
        verifiedBy: users[2]._id, // Robert Johnson (Staff)
        verificationDate: new Date(),
        issuedBy: 'AFP Medical Center',
        issuedDate: new Date('2023-01-15'),
        expirationDate: new Date('2024-01-15'),
      },
      {
        title: 'Training Certificate - Basic Combat',
        description: 'Certificate of completion for Basic Combat Training',
        type: DocumentType.TRAINING_CERTIFICATE,
        fileUrl: 'https://example.com/documents/training-cert-001.pdf',
        fileName: 'training-cert-001.pdf',
        fileSize: 2 * 1024 * 1024, // 2MB
        mimeType: 'application/pdf',
        userId: users[3]._id, // Michael Brown
        uploadedBy: users[3]._id, // Self-uploaded
        status: DocumentStatus.APPROVED,
        verifiedBy: users[2]._id, // Robert Johnson (Staff)
        verificationDate: new Date(),
        issuedBy: 'AFP Training Command',
        issuedDate: new Date('2022-06-20'),
      },
      {
        title: 'Military ID',
        description: 'Military identification card',
        type: DocumentType.IDENTIFICATION,
        fileUrl: 'https://example.com/documents/military-id-001.jpg',
        fileName: 'military-id-001.jpg',
        fileSize: 500 * 1024, // 500KB
        mimeType: 'image/jpeg',
        userId: users[4]._id, // David Wilson
        uploadedBy: users[4]._id, // Self-uploaded
        status: DocumentStatus.PENDING,
        issuedBy: 'AFP Personnel Division',
        issuedDate: new Date('2022-01-10'),
        expirationDate: new Date('2027-01-10'),
      },
      {
        title: 'Commendation Letter',
        description: 'Letter of commendation for exceptional service',
        type: DocumentType.COMMENDATION,
        fileUrl: 'https://example.com/documents/commendation-001.pdf',
        fileName: 'commendation-001.pdf',
        fileSize: 1.5 * 1024 * 1024, // 1.5MB
        mimeType: 'application/pdf',
        userId: users[6]._id, // James Miller
        uploadedBy: users[2]._id, // Robert Johnson (Staff)
        status: DocumentStatus.APPROVED,
        verifiedBy: users[1]._id, // Jane Smith (Admin)
        verificationDate: new Date(),
        issuedBy: 'Commanding Officer, HQ Company',
        issuedDate: new Date('2023-05-05'),
      },
    ]);
    console.log(`Created ${documents.length} documents`);

    // Calculate dates for upcoming training
    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(now.getDate() + 14);
    
    const sixteenDaysFromNow = new Date(now);
    sixteenDaysFromNow.setDate(now.getDate() + 16);

    // Create trainings
    console.log('Creating trainings...');
    const trainings = await Training.create([
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
            userId: users[3]._id, // Michael Brown
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
            userId: users[4]._id, // David Wilson
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
        createdBy: users[2]._id, // Robert Johnson (Staff)
        updatedBy: users[2]._id,
        tags: ['combat', 'tactical', 'advanced'],
        certificationOffered: true,
        certificationValidityPeriod: 24, // 2 years
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
            userId: users[3]._id, // Michael Brown
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
        createdBy: users[1]._id, // Jane Smith (Admin)
        updatedBy: users[1]._id,
        tags: ['medical', 'first aid', 'emergency'],
        certificationOffered: true,
        certificationValidityPeriod: 12, // 1 year
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
            userId: users[6]._id, // James Miller
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
        createdBy: users[1]._id, // Jane Smith (Admin)
        updatedBy: users[0]._id, // John Doe (Director)
        tags: ['leadership', 'command', 'strategy'],
        certificationOffered: true,
        certificationValidityPeriod: 36, // 3 years
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
            userId: users[6]._id, // James Miller
            status: 'registered',
            registrationDate: new Date(),
          },
        ],
        createdBy: users[2]._id, // Robert Johnson (Staff)
        tags: ['cyber', 'security', 'technical'],
        certificationOffered: true,
        certificationValidityPeriod: 12, // 1 year
      },
    ]);
    console.log(`Created ${trainings.length} trainings`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase(); 