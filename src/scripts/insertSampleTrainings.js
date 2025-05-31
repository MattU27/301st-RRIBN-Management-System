// Use ES module syntax for compatibility with Next.js
const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB connection string from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const opts = {
      bufferCommands: false,
    };
    
    await mongoose.connect(MONGODB_URI, opts);
    console.log('Connected to MongoDB');
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define training status and types from the model
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

// Define the Training schema
const TrainingSchema = new mongoose.Schema({
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
    ref: 'User',
    required: [true, 'Creator reference is required'],
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
}, {
  timestamps: true,
});

// Create indexes for efficient queries
TrainingSchema.index({ startDate: 1 });
TrainingSchema.index({ status: 1 });
TrainingSchema.index({ 'attendees.userId': 1 });

// Create the model
const Training = mongoose.models.Training || mongoose.model('Training', TrainingSchema);

// Admin user ID (you should replace this with a real admin ID from your database)
const adminUserId = new mongoose.Types.ObjectId('6579ba3f6c40c91b4f0ab37e');

// Sample training data
const sampleTrainings = [
  {
    title: 'Advanced Combat Training',
    description: 'Intensive course focusing on advanced combat techniques, tactical maneuvers, and weapon handling for reservists. Includes both classroom training and field exercises.',
    type: TrainingType.COMBAT_DRILL,
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-07-20'),
    location: {
      name: 'Camp Aguinaldo Training Grounds',
      address: 'EDSA, Quezon City, Metro Manila',
      coordinates: {
        latitude: 14.6086,
        longitude: 121.0547
      }
    },
    instructor: {
      name: 'Colonel James Rodriguez',
      rank: 'Colonel',
      specialization: 'Tactical Combat',
      contactInfo: 'james.rodriguez@afp.gov.ph'
    },
    status: TrainingStatus.UPCOMING,
    capacity: 45,
    eligibleRanks: ['Private', 'Corporal', 'Sergeant'],
    eligibleCompanies: ['Alpha Company', 'Bravo Company'],
    mandatory: false,
    tags: ['combat', 'tactical', 'weapons', 'field training'],
    certificationOffered: true,
    certificationValidityPeriod: 24,
    createdBy: adminUserId,
    attendees: []
  },
  {
    title: 'Emergency Medical Response',
    description: 'Comprehensive training on emergency medical procedures, first aid techniques, and disaster response protocols. Participants will learn to handle various medical emergencies in both civilian and combat situations.',
    type: TrainingType.MEDICAL,
    startDate: new Date('2024-08-05'),
    endDate: new Date('2024-08-07'),
    location: {
      name: 'AFP Medical Center',
      address: 'V. Luna Road, Quezon City',
      coordinates: {
        latitude: 14.6358,
        longitude: 121.0614
      }
    },
    instructor: {
      name: 'Major Sarah Johnson',
      rank: 'Major',
      specialization: 'Military Medicine',
      contactInfo: 'sarah.johnson@afpmedical.gov.ph'
    },
    status: TrainingStatus.UPCOMING,
    capacity: 30,
    eligibleRanks: ['Private', 'Corporal', 'Sergeant', 'Lieutenant'],
    eligibleCompanies: ['Medical Corps', 'All Units'],
    mandatory: true,
    tags: ['medical', 'first aid', 'emergency response'],
    certificationOffered: true,
    certificationValidityPeriod: 12,
    createdBy: adminUserId,
    attendees: []
  },
  {
    title: 'Strategic Leadership Symposium',
    description: 'Advanced leadership training designed for officers and NCOs. Covers strategic thinking, unit management, decision-making under pressure, and effective communication in military contexts.',
    type: TrainingType.LEADERSHIP,
    startDate: new Date('2024-09-10'),
    endDate: new Date('2024-09-12'),
    location: {
      name: 'AFP Officers Club',
      address: 'Camp Aguinaldo, Quezon City',
      coordinates: {
        latitude: 14.6100,
        longitude: 121.0550
      }
    },
    instructor: {
      name: 'General Robert Smith',
      rank: 'General',
      specialization: 'Strategic Command',
      contactInfo: 'robert.smith@afp.gov.ph'
    },
    status: TrainingStatus.UPCOMING,
    capacity: 25,
    eligibleRanks: ['Lieutenant', 'Captain', 'Major', 'Colonel'],
    eligibleCompanies: ['All Units'],
    mandatory: false,
    virtualMeetingUrl: 'https://meeting.afp.gov.ph/leadership-symposium',
    materials: [
      {
        title: 'Leadership in Crisis Handbook',
        fileUrl: '/materials/leadership-handbook.pdf',
        fileType: 'pdf'
      }
    ],
    tags: ['leadership', 'strategy', 'management'],
    certificationOffered: true,
    certificationValidityPeriod: 36,
    createdBy: adminUserId,
    attendees: []
  },
  {
    title: 'Tactical Communications Workshop',
    description: 'Specialized training on military communications systems, encryption protocols, and field communication techniques. Participants will learn to operate various communication equipment and follow secure communication procedures.',
    type: TrainingType.TECHNICAL,
    startDate: new Date('2024-06-20'),
    endDate: new Date('2024-06-23'),
    location: {
      name: 'Signal Battalion HQ',
      address: 'Fort Bonifacio, Taguig City',
      coordinates: {
        latitude: 14.5176,
        longitude: 121.0509
      }
    },
    instructor: {
      name: 'Lt. Col. David Chen',
      rank: 'Lieutenant Colonel',
      specialization: 'Communications Systems',
      contactInfo: 'david.chen@afp.gov.ph'
    },
    status: TrainingStatus.ONGOING,
    capacity: 40,
    eligibleRanks: ['Private', 'Corporal', 'Sergeant', 'Lieutenant'],
    eligibleCompanies: ['Signal Corps', 'Charlie Company'],
    mandatory: false,
    materials: [
      {
        title: 'Field Communications Manual',
        fileUrl: '/materials/comms-manual.pdf',
        fileType: 'pdf'
      },
      {
        title: 'Encryption Protocols',
        fileUrl: '/materials/encryption-guide.pdf',
        fileType: 'pdf'
      }
    ],
    tags: ['communications', 'technical', 'encryption', 'radio'],
    certificationOffered: true,
    certificationValidityPeriod: 18,
    createdBy: adminUserId,
    attendees: []
  },
  {
    title: 'Annual Physical Fitness Assessment',
    description: 'Mandatory annual physical fitness evaluation for all personnel. Includes running, push-ups, sit-ups, and other exercises to assess general fitness levels and readiness.',
    type: TrainingType.OTHER,
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-15'),
    location: {
      name: 'Camp Aguinaldo Parade Grounds',
      address: 'EDSA, Quezon City',
      coordinates: {
        latitude: 14.6095,
        longitude: 121.0540
      }
    },
    instructor: {
      name: 'Major Michael Torres',
      rank: 'Major',
      specialization: 'Physical Training',
      contactInfo: 'michael.torres@afp.gov.ph'
    },
    status: TrainingStatus.COMPLETED,
    capacity: 100,
    eligibleRanks: ['All Ranks'],
    eligibleCompanies: ['All Units'],
    mandatory: true,
    tags: ['fitness', 'assessment', 'physical training'],
    certificationOffered: false,
    createdBy: adminUserId,
    attendees: []
  }
];

// Insert the sample trainings
const insertSampleTrainings = async () => {
  try {
    await connectDB();
    
    // Insert the sample trainings even if there are already some in the database
    console.log('Adding new sample trainings to the database...');
    const result = await Training.insertMany(sampleTrainings);
    
    console.log(`Successfully inserted ${result.length} sample trainings.`);
    console.log('Sample training IDs:');
    result.forEach((training, index) => {
      console.log(`${index + 1}. ${training.title}: ${training._id}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error inserting sample trainings:', error);
    process.exit(1);
  }
};

// Run the insertion script
insertSampleTrainings(); 