/**
 * Script to add sample training completion records to populate the prescriptive analytics
 * Run with: node src/scripts/addSampleTrainingCompletions.js
 */

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/afp_personnel_db';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Personnel Schema
const PersonnelSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String,
  middleName: String,
  rank: String,
  company: mongoose.Schema.Types.Mixed,
  status: String,
  email: String,
  serviceNumber: String,
  isActive: Boolean,
  dateJoined: Date
}, { 
  collection: 'personnels' 
});

// Define Training Schema (simplified for this script)
const TrainingSchema = new mongoose.Schema({
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  status: String,
}, { 
  collection: 'trainings' 
});

// Define TrainingRegistration Schema
const TrainingRegistrationSchema = new mongoose.Schema({
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personnel',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'completed', 'absent', 'excused', 'cancelled'],
    default: 'registered'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  attendanceDate: Date,
  completionDate: Date,
  userData: {
    firstName: String,
    lastName: String,
    fullName: String,
    rank: String,
    company: String,
    email: String,
    militaryId: String
  },
}, {
  timestamps: true,
  collection: 'training_registrations'
});

// Create models using the existing collections
const Personnel = mongoose.model('Personnel', PersonnelSchema, 'personnels');
const Training = mongoose.model('Training', TrainingSchema, 'trainings');
const TrainingRegistration = mongoose.model('TrainingRegistration', TrainingRegistrationSchema, 'training_registrations');

// Function to randomly select elements from an array
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Main function to add sample training completions
async function addSampleCompletions() {
  try {
    // Get all personnel
    const personnel = await Personnel.find({ isActive: true }).lean();
    console.log(`Found ${personnel.length} active personnel records`);

    // Get all trainings
    const trainings = await Training.find().lean();
    console.log(`Found ${trainings.length} training records`);

    if (trainings.length === 0) {
      console.error('No trainings found. Please create trainings first.');
      process.exit(1);
    }

    if (personnel.length === 0) {
      console.error('No personnel found. Please create personnel first.');
      process.exit(1);
    }

    // Delete existing training registrations - COMMENT THIS OUT IF YOU WANT TO KEEP EXISTING DATA
    await TrainingRegistration.deleteMany({});
    console.log('Cleared existing training registrations');

    // Sample completion records to add
    const completionRecords = [];

    // Generate random completion dates within the last year
    const getRandomCompletionDate = () => {
      const now = new Date();
      const daysBack = Math.floor(Math.random() * 365); // Random day in the last year
      const result = new Date(now);
      result.setDate(result.getDate() - daysBack);
      return result;
    };

    // For each personnel, complete a random number of trainings
    for (const person of personnel) {
      // Decide how many trainings this person has completed (0-4)
      // Higher ranking personnel are more likely to have completed more trainings
      let completedCount = 0;
      
      switch (person.rank) {
        case 'Colonel':
        case 'Lieutenant Colonel':
        case 'Major':
          completedCount = Math.floor(Math.random() * 2) + 3; // 3-4 trainings
          break;
        case 'Captain':
        case 'First Lieutenant':
          completedCount = Math.floor(Math.random() * 2) + 2; // 2-3 trainings
          break;
        case 'Second Lieutenant':
        case 'Sergeant':
          completedCount = Math.floor(Math.random() * 2) + 1; // 1-2 trainings
          break;
        default:
          completedCount = Math.floor(Math.random() * 2); // 0-1 trainings
      }
      
      // Cap at number of available trainings
      completedCount = Math.min(completedCount, trainings.length);
      
      if (completedCount > 0) {
        // Select random trainings for this person
        const selectedTrainings = getRandomElements(trainings, completedCount);
        
        for (const training of selectedTrainings) {
          const completionDate = getRandomCompletionDate();
          const registrationDate = new Date(completionDate);
          registrationDate.setDate(registrationDate.getDate() - 14); // Registration was 2 weeks before completion
          
          const attendanceDate = new Date(completionDate);
          attendanceDate.setDate(attendanceDate.getDate() - 1); // Attendance was day before completion
          
          completionRecords.push({
            trainingId: training._id,
            userId: person._id,
            status: 'completed',
            registrationDate,
            attendanceDate,
            completionDate,
            userData: {
              firstName: person.firstName || '',
              lastName: person.lastName || '',
              fullName: person.name || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
              rank: person.rank || '',
              company: typeof person.company === 'string' ? person.company : 'Unknown',
              email: person.email || '',
              militaryId: person.serviceNumber || ''
            }
          });
        }
      }
    }

    // Insert all completion records
    if (completionRecords.length > 0) {
      const result = await TrainingRegistration.insertMany(completionRecords);
      console.log(`Added ${result.length} sample training completion records`);
    } else {
      console.log('No completion records generated');
    }

    console.log('Sample data creation complete');
  } catch (error) {
    console.error('Error adding sample completions:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the main function
addSampleCompletions(); 