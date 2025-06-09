/**
 * Script to seed training completion data in the database
 * 
 * This script will:
 * 1. Find all users in the system
 * 2. Find all trainings in the system
 * 3. Randomly mark some trainings as completed for each user
 */

const { MongoClient, ObjectId } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'afp_personnel_db';
const USERS_COLLECTION = 'personnels';
const TRAININGS_COLLECTION = 'trainings';
const TRAINING_REGISTRATIONS_COLLECTION = 'trainingregistrations';

// Connect to MongoDB
async function connectToMongo() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB');
  return { client, db: client.db(DB_NAME) };
}

// Get all users
async function getUsers(db) {
  const users = await db.collection(USERS_COLLECTION).find({}).toArray();
  console.log(`Found ${users.length} users`);
  return users;
}

// Get all trainings
async function getTrainings(db) {
  const trainings = await db.collection(TRAININGS_COLLECTION).find({}).toArray();
  console.log(`Found ${trainings.length} trainings`);
  return trainings;
}

// Mark trainings as completed
async function markTrainingsAsCompleted(db, users, trainings) {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  
  const completionDates = [oneMonthAgo, twoMonthsAgo, threeMonthsAgo];
  
  // For each user, mark some trainings as completed
  for (const user of users) {
    // Randomly select 30-70% of trainings to mark as completed
    const numTrainingsToComplete = Math.floor(trainings.length * (0.3 + Math.random() * 0.4));
    const trainingIndices = Array.from({ length: trainings.length }, (_, i) => i);
    
    // Shuffle the array to get random trainings
    for (let i = trainingIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [trainingIndices[i], trainingIndices[j]] = [trainingIndices[j], trainingIndices[i]];
    }
    
    // Take the first N trainings to mark as completed
    const selectedIndices = trainingIndices.slice(0, numTrainingsToComplete);
    
    for (const index of selectedIndices) {
      const training = trainings[index];
      
      // Generate a random completion date from the past
      const randomCompletionDateIndex = Math.floor(Math.random() * completionDates.length);
      const completionDate = new Date(completionDates[randomCompletionDateIndex]);
      
      // Generate a random score between 70 and 100
      const score = Math.floor(70 + Math.random() * 31);
      
      // Check if a registration already exists
      const existingRegistration = await db.collection(TRAINING_REGISTRATIONS_COLLECTION).findOne({
        userId: user._id,
        trainingId: training._id
      });
      
      if (existingRegistration) {
        // Update existing registration
        await db.collection(TRAINING_REGISTRATIONS_COLLECTION).updateOne(
          { _id: existingRegistration._id },
          {
            $set: {
              status: 'completed',
              completionDate: completionDate,
              performanceScore: score,
              updatedAt: now
            }
          }
        );
        console.log(`Updated existing registration for user ${user._id} and training ${training._id}`);
      } else {
        // Create new registration
        await db.collection(TRAINING_REGISTRATIONS_COLLECTION).insertOne({
          userId: user._id,
          trainingId: training._id,
          status: 'completed',
          registrationDate: new Date(completionDate.getFullYear(), completionDate.getMonth() - 1, completionDate.getDate()),
          completionDate: completionDate,
          performanceScore: score,
          createdAt: now,
          updatedAt: now
        });
        console.log(`Created new registration for user ${user._id} and training ${training._id}`);
      }
      
      // Also update the training's attendees list
      await db.collection(TRAININGS_COLLECTION).updateOne(
        { _id: training._id },
        {
          $addToSet: {
            attendees: {
              userId: user._id,
              status: 'completed',
              registrationDate: new Date(completionDate.getFullYear(), completionDate.getMonth() - 1, completionDate.getDate()),
              completionDate: completionDate
            }
          }
        }
      );
    }
    
    console.log(`Marked ${selectedIndices.length} trainings as completed for user ${user._id}`);
  }
}

// Main function
async function main() {
  let client;
  try {
    const { client: mongoClient, db } = await connectToMongo();
    client = mongoClient;
    
    const users = await getUsers(db);
    const trainings = await getTrainings(db);
    
    if (users.length === 0) {
      console.error('No users found in the database');
      process.exit(1);
    }
    
    if (trainings.length === 0) {
      console.error('No trainings found in the database');
      process.exit(1);
    }
    
    await markTrainingsAsCompleted(db, users, trainings);
    
    console.log('Training completion data seeded successfully');
  } catch (error) {
    console.error('Error seeding training completion data:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  }
}

// Run the script
main(); 