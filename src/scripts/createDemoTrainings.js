/**
 * This script creates demo training data in the existing afp_personnel_db database
 * using real personnel data.
 * Run it with: node src/scripts/createDemoTrainings.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string - explicitly set to use afp_personnel_db
const MONGODB_URI = 'mongodb://localhost:27017/afp_personnel_db';

// Define training status
const TrainingStatus = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// Define training types
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
}

// Helper function to create a Training schema
const createTrainingSchema = () => {
  return new mongoose.Schema({
    title: {
      type: String,
      required: [true, 'Please provide a training title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(TrainingType),
      required: [true, 'Please specify the training type'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    location: {
      name: String,
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    instructor: {
      name: String,
      rank: String,
      specialization: String,
      contactInfo: String,
    },
    status: {
      type: String,
      enum: Object.values(TrainingStatus),
      default: TrainingStatus.UPCOMING,
    },
    capacity: {
      type: Number,
    },
    eligibleRanks: [{
      type: String,
    }],
    eligibleCompanies: [{
      type: String,
    }],
    mandatory: {
      type: Boolean,
      default: false,
    },
    virtualMeetingUrl: {
      type: String,
    },
    materials: [{
      title: String,
      fileUrl: String,
      fileType: String,
    }],
    attendees: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['registered', 'attended', 'completed', 'absent', 'excused'],
        default: 'registered',
      },
      registrationDate: {
        type: Date,
        default: Date.now,
      },
      completionDate: Date,
      certificateUrl: String,
      feedback: String,
      performance: {
        score: Number,
        notes: String,
      },
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Creator reference is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },
    tags: [{
      type: String,
    }],
    certificationOffered: {
      type: Boolean,
      default: false,
    },
    certificationValidityPeriod: {
      type: Number, // In months
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }, {
    timestamps: true,
  });
};

// Create Personnel schema to match the personnels collection
const createPersonnelSchema = () => {
  return new mongoose.Schema({
    firstName: String,
    lastName: String,
    rank: String,
    company: String,
    serviceNumber: String,
    email: String,
    status: String,
    _id: mongoose.Schema.Types.ObjectId
  });
};

async function seedTrainings() {
  try {
    console.log('Connecting to MongoDB database afp_personnel_db...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB database afp_personnel_db');

    // Define the Training model - use 'trainings' collection specifically
    const TrainingSchema = createTrainingSchema();
    const Training = mongoose.models.Training || mongoose.model('Training', TrainingSchema, 'trainings');

    // Define the Personnel model using the 'personnels' collection
    const PersonnelSchema = createPersonnelSchema();
    const Personnel = mongoose.models.Personnel || mongoose.model('Personnel', PersonnelSchema, 'personnels');

    // Get all collections to see what's available
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));

    // Find admin user - we'll just use the first personnel as creator
    const personnelCount = await Personnel.countDocuments();
    console.log(`Found ${personnelCount} personnel in the personnels collection`);
    
    if (personnelCount === 0) {
      console.error('No personnel found in the database. Please make sure you have personnel data.');
      await mongoose.connection.close();
      return;
    }

    // Get one personnel to use as creator
    const adminUser = await Personnel.findOne();
    console.log(`Using personnel as creator: ${adminUser.firstName} ${adminUser.lastName}, rank: ${adminUser.rank}`);

    // Get personnel to use as attendees - limit to 50 for performance
    const personnel = await Personnel.find().limit(50);
    console.log(`Found ${personnel.length} personnel for possible training attendees`);

    // Current date for reference
    const now = new Date();

    // Create sample trainings
    const sampleTrainings = [
      {
        title: 'Basic Combat Training',
        description: 'Essential combat skills for all military personnel including weapons handling, tactical movement, combat communications, and unit coordination. This course provides foundational military training required for all infantry soldiers.',
        type: TrainingType.COMBAT_DRILL,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
        location: { name: 'Camp Aguinaldo Training Ground', address: 'Quezon City, Metro Manila' },
        instructor: { name: 'Col. Ramon Magsaysay', rank: 'Colonel', specialization: 'Combat Training' },
        status: TrainingStatus.UPCOMING,
        capacity: 50,
        mandatory: true,
        createdBy: adminUser._id,
        tags: ['combat', 'basic training', 'infantry'],
        certificationOffered: true,
      },
      {
        title: 'Staff Officer Development Course',
        description: 'Advanced leadership and management training for staff officers focusing on operational planning, resource management, and command decision-making. This course prepares officers for higher command responsibilities.',
        type: TrainingType.CLASSROOM,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        location: { name: 'AFP Officers Club', address: 'Camp General Emilio Aguinaldo, Quezon City' },
        instructor: { name: 'Gen. Antonio Luna', rank: 'General', specialization: 'Leadership & Strategic Planning' },
        status: TrainingStatus.UPCOMING,
        capacity: 20,
        mandatory: false,
        eligibleRanks: ['Captain', 'Major', 'Lieutenant Colonel'],
        createdBy: adminUser._id,
        tags: ['leadership', 'staff development', 'command'],
        certificationOffered: true,
      },
      {
        title: 'Medical First Response',
        description: 'Emergency medical response training for combat situations including triage, field treatments, and evacuation procedures. Includes hands-on practice with medical equipment and casualty simulation exercises.',
        type: TrainingType.MEDICAL,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 22),
        location: { name: 'AFP Medical Center', address: 'V. Luna Road, Quezon City' },
        instructor: { name: 'Maj. Rosa Alvarez', rank: 'Major', specialization: 'Combat Medicine' },
        status: TrainingStatus.UPCOMING,
        capacity: 30,
        mandatory: false,
        createdBy: adminUser._id,
        tags: ['medical', 'first aid', 'field medicine'],
        certificationOffered: true,
      },
      {
        title: 'Cyber Defense and Information Security Workshop',
        description: 'Advanced training on protecting military networks, detecting intrusions, and responding to cyber threats. This workshop covers latest cybersecurity trends, threat intelligence, and practical defense techniques.',
        type: TrainingType.WORKSHOP,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 17),
        location: { 
          name: 'AFP Communications, Electronics and Information Systems Service', 
          address: 'Camp Aguinaldo, Quezon City'
        },
        instructor: { 
          name: 'Maj. Maria Clara', 
          rank: 'Major', 
          specialization: 'Cybersecurity',
          contactInfo: 'mclara@afp.mil.ph'
        },
        status: TrainingStatus.UPCOMING,
        capacity: 25,
        mandatory: false,
        eligibleCompanies: ['Intelligence', 'Communications', 'Headquarters'],
        createdBy: adminUser._id,
        tags: ['cyber', 'information security', 'network defense'],
        certificationOffered: true,
      },
      {
        title: 'KAMANDAG 2023 Joint Military Exercise',
        description: 'Annual military exercise between the Armed Forces of the Philippines and the United States Marine Corps focusing on amphibious operations, disaster response, and counter-terrorism tactics.',
        type: TrainingType.FIELD_EXERCISE,
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 25),
        location: { 
          name: 'Naval Base Subic Bay', 
          address: 'Subic Bay Freeport Zone, Zambales'
        },
        instructor: { 
          name: 'Col. Jose Rizal', 
          rank: 'Colonel', 
          specialization: 'Joint Operations',
          contactInfo: 'jrizal@afp.mil.ph'
        },
        status: TrainingStatus.UPCOMING,
        capacity: 100,
        mandatory: false,
        eligibleRanks: ['Captain', 'Major', 'Lieutenant Colonel', 'Colonel'],
        createdBy: adminUser._id,
        tags: ['joint exercise', 'amphibious', 'disaster response', 'counter-terrorism'],
        certificationOffered: true,
      },
      {
        title: 'Urban Warfare and Close Quarter Battle',
        description: 'Intensive training on urban combat tactics, room clearing, building assault, and hostage rescue operations. Includes live-fire exercises and tactical simulations in purpose-built urban training facilities.',
        type: TrainingType.COMBAT_DRILL,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 35),
        location: { 
          name: 'Special Forces School', 
          address: 'Fort Magsaysay, Nueva Ecija'
        },
        instructor: { 
          name: 'Lt. Col. Datu Lapu-Lapu', 
          rank: 'Lieutenant Colonel', 
          specialization: 'Special Operations',
          contactInfo: 'lapulapu@afp.mil.ph'
        },
        status: TrainingStatus.UPCOMING,
        capacity: 40,
        mandatory: false,
        eligibleCompanies: ['Special Forces', 'Light Reaction Regiment', 'Scout Rangers'],
        createdBy: adminUser._id,
        tags: ['urban warfare', 'CQB', 'special operations', 'tactical'],
        certificationOffered: true,
      },
      {
        title: 'Command and General Staff Course',
        description: 'Premier professional military education for senior officers preparing for command and staff responsibilities at operational and strategic levels. The course emphasizes joint operations, strategic planning, and national security policy.',
        type: TrainingType.LEADERSHIP,
        startDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 5, 30),
        location: { 
          name: 'AFP Command and General Staff College', 
          address: 'Camp Aguinaldo, Quezon City'
        },
        instructor: { 
          name: 'Gen. Emilio Aguinaldo', 
          rank: 'General', 
          specialization: 'Strategic Leadership',
          contactInfo: 'eaguinaldo@afp.mil.ph'
        },
        status: TrainingStatus.UPCOMING,
        capacity: 30,
        mandatory: true,
        eligibleRanks: ['Major', 'Lieutenant Colonel', 'Colonel'],
        createdBy: adminUser._id,
        tags: ['command', 'staff', 'strategic', 'leadership'],
        certificationOffered: true,
      }
    ];

    // Add real personnel as attendees to each training
    if (personnel.length > 0) {
      // Status options
      const statuses = ['registered', 'attended', 'completed'];
      
      sampleTrainings.forEach(training => {
        const numAttendees = Math.floor(Math.random() * Math.min(15, personnel.length)) + 5; // At least 5 attendees
        training.attendees = [];
        
        for (let i = 0; i < numAttendees; i++) {
          const person = personnel[i % personnel.length];
          
          // Create attendee with the real personnel data
          training.attendees.push({
            userId: person._id,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            registrationDate: new Date(now.getTime() - (Math.random() * 14 * 24 * 60 * 60 * 1000)), // Random date in last 2 weeks
            completionDate: Math.random() > 0.5 ? new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)) : undefined
          });
        }
      });
    }

    // Check if there are already trainings in the database
    const existingTrainings = await Training.find();
    console.log(`Found ${existingTrainings.length} existing trainings`);
    
    // Clear existing trainings first if they exist
    if (existingTrainings.length > 0) {
      console.log('Removing existing trainings before adding new ones...');
      await Training.deleteMany({});
      console.log('Existing trainings removed successfully');
    }

    // Insert sample trainings
    const result = await Training.insertMany(sampleTrainings);
    console.log(`Successfully inserted ${result.length} training records with real personnel data`);

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding trainings:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeding function
seedTrainings(); 