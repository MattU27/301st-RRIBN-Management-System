/**
 * Script to seed training data in the database
 * 
 * This script will:
 * 1. Create sample training data
 * 2. Insert the data into the trainings collection
 */

const { MongoClient, ObjectId } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'afp_personnel_db';
const TRAININGS_COLLECTION = 'trainings';

// Connect to MongoDB
async function connectToMongo() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB');
  return { client, db: client.db(DB_NAME) };
}

// Generate sample training data
function generateTrainingData() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Create trainings for the past, present, and future
  const trainings = [
    // Past trainings (completed)
    {
      title: "Basic Combat Training",
      description: "Foundational training for all military personnel covering basic combat skills",
      type: "Course",
      startDate: new Date(currentYear - 1, currentMonth - 3, 10),
      endDate: new Date(currentYear - 1, currentMonth - 3, 20),
      location: { name: "Camp Aguinaldo", address: "EDSA, Quezon City", coordinates: { lat: 14.6042, lng: 121.0448 } },
      instructor: { name: "Col. Juan Dela Cruz", rank: "Colonel", specialization: "Infantry" },
      status: "completed",
      capacity: 50,
      registered: 45,
      eligibleRanks: ["Private", "Private First Class", "Corporal"],
      eligibleCompanies: [],
      mandatory: true,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["combat", "basic training"],
      certificationOffered: true,
      materials: ["Combat Manual", "Field Guide"],
      createdAt: new Date(currentYear - 1, currentMonth - 4, 1),
      updatedAt: new Date(currentYear - 1, currentMonth - 3, 21),
      __v: 0
    },
    {
      title: "Advanced Leadership Development",
      description: "Training for officers to develop leadership skills in combat and administrative scenarios",
      type: "Seminar",
      startDate: new Date(currentYear - 1, currentMonth - 2, 15),
      endDate: new Date(currentYear - 1, currentMonth - 2, 17),
      location: { name: "Fort Bonifacio", address: "Taguig City", coordinates: { lat: 14.5176, lng: 121.0509 } },
      instructor: { name: "Gen. Maria Santos", rank: "General", specialization: "Leadership" },
      status: "completed",
      capacity: 30,
      registered: 28,
      eligibleRanks: ["Lieutenant", "Captain", "Major"],
      eligibleCompanies: [],
      mandatory: false,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["leadership", "officer training"],
      certificationOffered: true,
      materials: ["Leadership Manual", "Case Studies"],
      createdAt: new Date(currentYear - 1, currentMonth - 3, 1),
      updatedAt: new Date(currentYear - 1, currentMonth - 2, 18),
      __v: 0
    },
    {
      title: "Tactical Communications",
      description: "Training on military communications protocols and equipment operation",
      type: "Workshop",
      startDate: new Date(currentYear - 1, currentMonth - 1, 5),
      endDate: new Date(currentYear - 1, currentMonth - 1, 7),
      location: { name: "Camp Lapu-Lapu", address: "Cebu City", coordinates: { lat: 10.3157, lng: 123.8854 } },
      instructor: { name: "Maj. Roberto Reyes", rank: "Major", specialization: "Communications" },
      status: "completed",
      capacity: 25,
      registered: 22,
      eligibleRanks: [],
      eligibleCompanies: ["Alpha", "Bravo"],
      mandatory: true,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["communications", "tactical"],
      certificationOffered: false,
      materials: ["Communications Field Manual", "Equipment Guides"],
      createdAt: new Date(currentYear - 1, currentMonth - 2, 1),
      updatedAt: new Date(currentYear - 1, currentMonth - 1, 8),
      __v: 0
    },
    
    // Current/Ongoing trainings
    {
      title: "Urban Warfare Tactics",
      description: "Specialized training for combat operations in urban environments",
      type: "Course",
      startDate: new Date(currentYear, currentMonth, now.getDate() - 2),
      endDate: new Date(currentYear, currentMonth, now.getDate() + 5),
      location: { name: "Subic Bay", address: "Zambales", coordinates: { lat: 14.7924, lng: 120.2816 } },
      instructor: { name: "Lt. Col. Antonio Mendoza", rank: "Lieutenant Colonel", specialization: "Urban Warfare" },
      status: "ongoing",
      capacity: 40,
      registered: 35,
      eligibleRanks: [],
      eligibleCompanies: ["Charlie", "Delta"],
      mandatory: false,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["urban warfare", "tactical"],
      certificationOffered: true,
      materials: ["Urban Combat Manual", "City Maps"],
      createdAt: new Date(currentYear, currentMonth - 1, 15),
      updatedAt: new Date(currentYear, currentMonth, now.getDate() - 2),
      __v: 0
    },
    {
      title: "Field Medical Response",
      description: "Training on emergency medical procedures in combat situations",
      type: "Workshop",
      startDate: new Date(currentYear, currentMonth, now.getDate() - 1),
      endDate: new Date(currentYear, currentMonth, now.getDate() + 2),
      location: { name: "V. Luna Medical Center", address: "Quezon City", coordinates: { lat: 14.6346, lng: 121.0591 } },
      instructor: { name: "Capt. Elena Cruz", rank: "Captain", specialization: "Combat Medicine" },
      status: "ongoing",
      capacity: 30,
      registered: 28,
      eligibleRanks: [],
      eligibleCompanies: [],
      mandatory: true,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["medical", "emergency response"],
      certificationOffered: true,
      materials: ["Field Medical Manual", "First Aid Kits"],
      createdAt: new Date(currentYear, currentMonth - 1, 10),
      updatedAt: new Date(currentYear, currentMonth, now.getDate() - 1),
      __v: 0
    },
    
    // Upcoming trainings
    {
      title: "Cyber Defense Operations",
      description: "Training on cybersecurity and defense against digital threats",
      type: "Course",
      startDate: new Date(currentYear, currentMonth, now.getDate() + 10),
      endDate: new Date(currentYear, currentMonth, now.getDate() + 15),
      location: { name: "AFP Cyber Defense HQ", address: "Manila", coordinates: { lat: 14.5995, lng: 120.9842 } },
      instructor: { name: "Maj. Teresa Lim", rank: "Major", specialization: "Cyber Security" },
      status: "upcoming",
      capacity: 20,
      registered: 15,
      eligibleRanks: [],
      eligibleCompanies: ["Echo", "Foxtrot"],
      mandatory: false,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["cyber", "security", "technology"],
      certificationOffered: true,
      materials: ["Cyber Defense Manual", "Software Tools"],
      createdAt: new Date(currentYear, currentMonth - 1, 1),
      updatedAt: new Date(currentYear, currentMonth - 1, 1),
      __v: 0
    },
    {
      title: "Amphibious Landing Operations",
      description: "Training for beach and coastal military operations",
      type: "Exercise",
      startDate: new Date(currentYear, currentMonth, now.getDate() + 20),
      endDate: new Date(currentYear, currentMonth, now.getDate() + 25),
      location: { name: "Naval Base Cavite", address: "Cavite", coordinates: { lat: 14.4791, lng: 120.8970 } },
      instructor: { name: "Cmdr. Rafael Marquez", rank: "Commander", specialization: "Naval Operations" },
      status: "upcoming",
      capacity: 60,
      registered: 45,
      eligibleRanks: ["Private", "Private First Class", "Corporal", "Sergeant"],
      eligibleCompanies: [],
      mandatory: true,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["naval", "amphibious", "coastal"],
      certificationOffered: false,
      materials: ["Naval Operations Manual", "Coastal Maps"],
      createdAt: new Date(currentYear, currentMonth - 1, 5),
      updatedAt: new Date(currentYear, currentMonth - 1, 5),
      __v: 0
    },
    {
      title: "Drone Reconnaissance",
      description: "Training on unmanned aerial vehicle operations for surveillance",
      type: "Workshop",
      startDate: new Date(currentYear, currentMonth + 1, 5),
      endDate: new Date(currentYear, currentMonth + 1, 8),
      location: { name: "Clark Air Base", address: "Pampanga", coordinates: { lat: 15.1869, lng: 120.5508 } },
      instructor: { name: "Lt. Sofia Reyes", rank: "Lieutenant", specialization: "UAV Operations" },
      status: "upcoming",
      capacity: 25,
      registered: 20,
      eligibleRanks: [],
      eligibleCompanies: ["Golf", "Hotel"],
      mandatory: false,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["drone", "reconnaissance", "surveillance"],
      certificationOffered: true,
      materials: ["Drone Operations Manual", "Flight Charts"],
      createdAt: new Date(currentYear, currentMonth - 1, 15),
      updatedAt: new Date(currentYear, currentMonth - 1, 15),
      __v: 0
    },
    {
      title: "Mountain Warfare Training",
      description: "Specialized training for combat operations in mountainous terrain",
      type: "Course",
      startDate: new Date(currentYear, currentMonth + 1, 15),
      endDate: new Date(currentYear, currentMonth + 1, 25),
      location: { name: "Cordillera Training Camp", address: "Benguet", coordinates: { lat: 16.4023, lng: 120.5960 } },
      instructor: { name: "Col. Eduardo Santos", rank: "Colonel", specialization: "Mountain Warfare" },
      status: "upcoming",
      capacity: 35,
      registered: 25,
      eligibleRanks: ["Private First Class", "Corporal", "Sergeant", "Staff Sergeant"],
      eligibleCompanies: [],
      mandatory: false,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["mountain", "terrain", "survival"],
      certificationOffered: true,
      materials: ["Mountain Warfare Manual", "Topographic Maps"],
      createdAt: new Date(currentYear, currentMonth - 1, 20),
      updatedAt: new Date(currentYear, currentMonth - 1, 20),
      __v: 0
    },
    {
      title: "Joint Forces Command Exercise",
      description: "Large-scale exercise involving multiple military branches",
      type: "Exercise",
      startDate: new Date(currentYear, currentMonth + 2, 1),
      endDate: new Date(currentYear, currentMonth + 2, 10),
      location: { name: "AFP Joint Command Center", address: "Manila", coordinates: { lat: 14.5869, lng: 121.0378 } },
      instructor: { name: "Gen. Ricardo Tan", rank: "General", specialization: "Joint Operations" },
      status: "upcoming",
      capacity: 100,
      registered: 80,
      eligibleRanks: ["Lieutenant", "Captain", "Major", "Lieutenant Colonel", "Colonel"],
      eligibleCompanies: [],
      mandatory: true,
      attendees: [],
      createdBy: new ObjectId(),
      tags: ["joint forces", "command", "large-scale"],
      certificationOffered: false,
      materials: ["Joint Operations Manual", "Command Structure Diagrams"],
      createdAt: new Date(currentYear, currentMonth, 1),
      updatedAt: new Date(currentYear, currentMonth, 1),
      __v: 0
    }
  ];
  
  return trainings;
}

// Insert training data into the database
async function seedTrainingData(db) {
  const trainings = generateTrainingData();
  
  try {
    // Check if trainings already exist
    const existingCount = await db.collection(TRAININGS_COLLECTION).countDocuments();
    console.log(`Found ${existingCount} existing trainings`);
    
    // Delete existing trainings if any
    if (existingCount > 0) {
      console.log('Removing existing trainings...');
      await db.collection(TRAININGS_COLLECTION).deleteMany({});
      console.log('Existing trainings removed');
    }
    
    // Insert trainings
    const result = await db.collection(TRAININGS_COLLECTION).insertMany(trainings);
    console.log(`${result.insertedCount} trainings inserted successfully`);
  } catch (error) {
    console.error('Error inserting training data:', error);
    throw error;
  }
}

// Main function
async function main() {
  let client;
  try {
    const { client: mongoClient, db } = await connectToMongo();
    client = mongoClient;
    
    await seedTrainingData(db);
    
    console.log('Training data seeded successfully');
  } catch (error) {
    console.error('Error seeding training data:', error);
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