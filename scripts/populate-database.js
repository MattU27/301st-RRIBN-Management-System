#!/usr/bin/env node

/**
 * AFP Personnel Management System - Database Population Script
 * This script generates realistic test data for all collections in the database
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';
const JSON_DB_PATH = path.join(__dirname, '..', 'afp_personnel_db');
const USE_JSON_FALLBACK = process.env.USE_JSON_FALLBACK === 'true';

// Ensure JSON directory exists
if (!fs.existsSync(JSON_DB_PATH)) {
  fs.mkdirSync(JSON_DB_PATH, { recursive: true });
}

// Data generators
const RANKS = [
  'Private', 'Private First Class', 'Corporal', 'Sergeant', 'Staff Sergeant',
  'Technical Sergeant', 'Master Sergeant', 'First Sergeant', 'Sergeant Major',
  'Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel',
  'Colonel', 'Brigadier General', 'Major General', 'Lieutenant General', 'General'
];

const COMPANIES = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'Headquarters', 'NERRSC (NERR-Signal Company)', 'NERRFAB (NERR-Field Artillery Battery)',
  'Medical Corps', 'Engineering Battalion', 'Intelligence Division', 'Airborne Company'
];

const FILIPINO_FIRST_NAMES = [
  'Jose', 'Maria', 'Juan', 'Ana', 'Antonio', 'Elena', 'Miguel', 'Carmen', 'Francisco', 'Luz',
  'Pedro', 'Rosa', 'Manuel', 'Teresa', 'Carlos', 'Margarita', 'Luis', 'Patricia', 'Angel', 'Cristina',
  'Roberto', 'Gloria', 'Fernando', 'Esperanza', 'Ricardo', 'Dolores', 'Ramon', 'Mercedes', 'Alfredo', 'Josefina',
  'Eduardo', 'Remedios', 'Alejandro', 'Concepcion', 'Gerardo', 'Milagros', 'Rafael', 'Pilar', 'Arturo', 'Soledad',
  'Domingo', 'Rosario', 'Salvador', 'Victoria', 'Ernesto', 'Felicidad', 'Mario', 'Amparo', 'Armando', 'Natividad'
];

const FILIPINO_LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andres',
  'Marquez', 'Romualdez', 'Mercado', 'Aguilar', 'Manalo', 'Dimaguila', 'Villanueva', 'Ramos', 'Aquino', 'Dela Cruz',
  'Rivera', 'Diaz', 'Gonzales', 'Perez', 'Sanchez', 'Ramirez', 'Flores', 'Herrera', 'Gutierrez', 'Morales',
  'Jimenez', 'Alvarez', 'Ruiz', 'Hernandez', 'Lopez', 'Gomez', 'Martin', 'Fernandez', 'Rodriguez', 'Vargas',
  'Castillo', 'Iglesias', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marin', 'Sanz', 'Nunez'
];

const TRAINING_TYPES = [
  'Basic Combat Training', 'Advanced Infantry Training', 'Leadership Development',
  'First Aid and Medical Training', 'Weapons Safety Training', 'Physical Fitness Assessment',
  'Combat Engineering', 'Communications Training', 'Survival Training', 'Tactical Operations',
  'Marksmanship Training', 'Field Artillery Training', 'Airborne Operations', 'Urban Combat',
  'Intelligence Gathering', 'Military Law and Ethics', 'Equipment Maintenance', 'Drill and Ceremony'
];

const POLICY_CATEGORIES = [
  'Personnel Management', 'Training and Development', 'Equipment and Logistics',
  'Safety and Security', 'Administrative Procedures', 'Discipline and Conduct',
  'Promotions', 'Medical and Health', 'Finance and Benefits', 'Operations'
];

const LOCATIONS = [
  'Camp Aguinaldo, Quezon City', 'Fort Bonifacio, Taguig City', 'Camp Lapu-Lapu, Cebu City',
  'Fort Magsaysay, Nueva Ecija', 'Camp General Emilio Aguinaldo, Cavite', 'Camp General Servillano Aquino, Tarlac',
  'Camp Capinpin, Tanay, Rizal', 'Camp General Arturo Enrile, Zamboanga City', 'V. Luna Medical Center, Quezon City'
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateServiceNumber() {
  const year = randomInt(2018, 2025);
  const number = randomInt(10000, 99999);
  return `${year}-${number}`;
}

function generatePhoneNumber() {
  return `9${randomInt(100000000, 999999999)}`;
}

function generateEmail(firstName, lastName) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mil.ph`;
}

function generateAddress() {
  const streets = ['Rizal Street', 'Bonifacio Avenue', 'Quezon Boulevard', 'Mabini Street', 'Roxas Boulevard'];
  const cities = ['Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'San Juan'];
  const barangays = ['Barangay 1', 'Barangay 2', 'Barangay Central', 'Poblacion'];
  
  return `${randomInt(1, 999)} ${randomChoice(streets)}, ${randomChoice(barangays)}, ${randomChoice(cities)}, Philippines`;
}

// Data generators
function generateUsers(count = 100) {
  const users = [];
  const roles = ['user', 'staff', 'admin', 'director'];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(FILIPINO_FIRST_NAMES);
    const lastName = randomChoice(FILIPINO_LAST_NAMES);
    const email = generateEmail(firstName, lastName);
    const serviceId = generateServiceNumber();
    const role = i < 5 ? randomChoice(['admin', 'director', 'staff']) : 'user';
    
    users.push({
      _id: new ObjectId(),
      firstName,
      lastName,
      email,
      alternativeEmail: `${firstName.toLowerCase()}${lastName.toLowerCase()}@gmail.com`,
      password: bcrypt.hashSync('password123', 10),
      role,
      company: randomChoice(COMPANIES),
      rank: randomChoice(RANKS),
      serviceId,
      militaryId: serviceId,
      status: randomChoice(['active', 'inactive']) === 'active' ? 'active' : 'deactivated',
      specializations: [],
      createdAt: randomDate(new Date('2024-01-01'), new Date()),
      updatedAt: new Date(),
      lastLogin: randomDate(new Date('2024-06-01'), new Date()),
      isArchived: Math.random() < 0.1,
      canRegister: true,
      isRegistrationComplete: Math.random() < 0.8,
      ...(Math.random() < 0.2 && { deactivationReason: 'Administrative leave' })
    });
  }
  
  return users;
}

function generatePersonnels(users) {
  return users.map(user => ({
    _id: new ObjectId(),
    email: user.email,
    alternativeEmail: user.alternativeEmail,
    password: 'Jm22152927-@',
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`,
    middleName: Math.random() < 0.3 ? randomChoice(FILIPINO_FIRST_NAMES) : null,
    phone: generatePhoneNumber(),
    rank: user.rank,
    company: user.company,
    serviceNumber: user.serviceId,
    status: randomChoice(['Ready', 'Not Ready', 'Medical Hold', 'Training']),
    address: generateAddress(),
    role: user.role === 'user' ? 'reservist' : user.role,
    isVerified: Math.random() < 0.9,
    isActive: user.status === 'active',
    dateJoined: user.createdAt.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastUpdated: user.updatedAt.toISOString(),
    __v: 0
  }));
}

function generateTrainings(count = 30) {
  const trainings = [];
  const statuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
  
  for (let i = 0; i < count; i++) {
    const startDate = randomDate(new Date('2024-01-01'), new Date('2025-12-31'));
    const endDate = new Date(startDate.getTime() + (randomInt(1, 14) * 24 * 60 * 60 * 1000));
    const capacity = randomInt(20, 100);
    const registered = randomInt(5, capacity);
    
    trainings.push({
      _id: new ObjectId(),
      title: randomChoice(TRAINING_TYPES),
      description: `Comprehensive training program for ${randomChoice(TRAINING_TYPES).toLowerCase()}`,
      type: randomChoice(['Course', 'Workshop', 'Seminar', 'Drill', 'Exercise']),
      startDate,
      endDate,
      location: {
        name: randomChoice(LOCATIONS).split(',')[0],
        address: randomChoice(LOCATIONS),
        coordinates: {
          lat: 14.6042 + (Math.random() - 0.5) * 2,
          lng: 121.0448 + (Math.random() - 0.5) * 2
        }
      },
      instructor: {
        name: `${randomChoice(['Col.', 'Lt. Col.', 'Maj.', 'Capt.'])} ${randomChoice(FILIPINO_FIRST_NAMES)} ${randomChoice(FILIPINO_LAST_NAMES)}`,
        rank: randomChoice(RANKS.slice(-10)),
        specialization: randomChoice(['Infantry', 'Artillery', 'Engineering', 'Medical', 'Intelligence'])
      },
      status: randomChoice(statuses),
      capacity,
      registered,
      eligibleRanks: randomChoice([
        RANKS.slice(0, 5),
        RANKS.slice(5, 10),
        RANKS.slice(10),
        []
      ]),
      eligibleCompanies: Math.random() < 0.3 ? [randomChoice(COMPANIES)] : [],
      mandatory: Math.random() < 0.4,
      attendees: [],
      createdAt: randomDate(new Date('2024-01-01'), startDate),
      updatedAt: new Date(),
      __v: 0
    });
  }
  
  return trainings;
}

function generateActivities(users, count = 50) {
  const activities = [];
  const actionTypes = [
    'login', 'logout', 'profile_update', 'training_registration', 'document_upload',
    'policy_view', 'announcement_create', 'user_create', 'user_update', 'training_complete'
  ];
  
  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    activities.push({
      _id: new ObjectId(),
      userId: user._id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: randomChoice(actionTypes),
      details: `User performed ${randomChoice(actionTypes).replace('_', ' ')}`,
      timestamp: randomDate(new Date('2024-01-01'), new Date()),
      ipAddress: `192.168.1.${randomInt(1, 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      __v: 0
    });
  }
  
  return activities;
}

function generateAnnouncements(users, count = 20) {
  const announcements = [];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const titles = [
    'Base Security Update', 'Training Schedule Change', 'Equipment Maintenance',
    'Medical Check-up Reminder', 'Leave Application Deadline', 'Promotion Results',
    'Safety Briefing', 'New Policy Implementation', 'Emergency Drill', 'Unit Formation'
  ];
  
  for (let i = 0; i < count; i++) {
    const author = randomChoice(users.filter(u => ['admin', 'director', 'staff'].includes(u.role)));
    const publishDate = randomDate(new Date('2024-01-01'), new Date());
    
    announcements.push({
      _id: new ObjectId(),
      title: randomChoice(titles),
      content: `This is an important announcement regarding ${randomChoice(titles).toLowerCase()}. All personnel are advised to take note of the following instructions and comply accordingly.`,
      author: author._id,
      authorName: `${author.firstName} ${author.lastName} (${author.role.charAt(0).toUpperCase() + author.role.slice(1)})`,
      status: 'published',
      priority: randomChoice(priorities),
      targetCompanies: Math.random() < 0.3 ? [randomChoice(COMPANIES)] : null,
      targetRoles: Math.random() < 0.2 ? [randomChoice(['user', 'staff'])] : null,
      publishDate,
      expiryDate: Math.random() < 0.5 ? new Date(publishDate.getTime() + (randomInt(7, 30) * 24 * 60 * 60 * 1000)) : null,
      attachmentUrls: [],
      viewCount: randomInt(0, 100),
      createdAt: publishDate,
      updatedAt: new Date(),
      __v: 0
    });
  }
  
  return announcements;
}

function generatePolicies(users, count = 15) {
  const policies = [];
  
  for (let i = 0; i < count; i++) {
    const creator = randomChoice(users.filter(u => ['admin', 'director'].includes(u.role)));
    const category = randomChoice(POLICY_CATEGORIES);
    
    policies.push({
      _id: new ObjectId(),
      title: `${category} Policy Guidelines`,
      description: `Comprehensive policy guidelines for ${category.toLowerCase()} procedures and regulations.`,
      content: `This policy document outlines the procedures and regulations for ${category.toLowerCase()}. All personnel must adhere to these guidelines.`,
      category,
      version: `${randomInt(1, 3)}.${randomInt(0, 9)}`,
      status: randomChoice(['draft', 'published', 'archived']),
      effectiveDate: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
      createdBy: creator._id,
      createdAt: randomDate(new Date('2024-01-01'), new Date()),
      updatedAt: new Date(),
      __v: 0
    });
  }
  
  return policies;
}

function generateAuditLogs(users, count = 100) {
  const auditLogs = [];
  const actions = [
    'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'LOGIN', 'LOGOUT',
    'CREATE_TRAINING', 'UPDATE_TRAINING', 'DELETE_TRAINING',
    'CREATE_POLICY', 'UPDATE_POLICY', 'DELETE_POLICY',
    'CREATE_ANNOUNCEMENT', 'UPDATE_ANNOUNCEMENT', 'DELETE_ANNOUNCEMENT'
  ];
  
  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    const action = randomChoice(actions);
    
    auditLogs.push({
      _id: new ObjectId(),
      userId: user._id,
      userEmail: user.email,
      action,
      resource: action.split('_')[1]?.toLowerCase() || 'system',
      resourceId: new ObjectId(),
      changes: {
        before: {},
        after: {}
      },
      timestamp: randomDate(new Date('2024-01-01'), new Date()),
      ipAddress: `192.168.1.${randomInt(1, 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: Math.random() < 0.95,
      __v: 0
    });
  }
  
  return auditLogs;
}

function generateTrainingRegistrations(users, trainings, count = 200) {
  const registrations = [];
  const statuses = ['registered', 'completed', 'cancelled', 'no-show'];
  
  for (let i = 0; i < count; i++) {
    const user = randomChoice(users);
    const training = randomChoice(trainings);
    const registrationDate = randomDate(training.createdAt, training.startDate);
    
    registrations.push({
      _id: new ObjectId(),
      userId: user._id,
      trainingId: training._id,
      status: randomChoice(statuses),
      registrationDate,
      completionDate: Math.random() < 0.7 ? randomDate(training.startDate, training.endDate) : null,
      createdAt: registrationDate,
      updatedAt: new Date(),
      __v: 0
    });
  }
  
  return registrations;
}

// Database operations
async function saveToMongoDB(data) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    const collections = Object.keys(data);
    for (const collectionName of collections) {
      await db.collection(collectionName).deleteMany({});
      console.log(`Cleared ${collectionName} collection`);
    }
    
    // Insert new data
    for (const [collectionName, documents] of Object.entries(data)) {
      if (documents.length > 0) {
        await db.collection(collectionName).insertMany(documents);
        console.log(`Inserted ${documents.length} documents into ${collectionName}`);
      }
    }
    
    console.log('Database population completed successfully!');
    
  } catch (error) {
    console.error('Error populating MongoDB:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function saveToJSON(data) {
  try {
    for (const [collectionName, documents] of Object.entries(data)) {
      const filePath = path.join(JSON_DB_PATH, `afp_personnel_db.${collectionName}.json`);
      
      // Convert ObjectIds to proper format for JSON
      const jsonData = documents.map(doc => {
        const converted = { ...doc };
        if (converted._id && converted._id.toString) {
          converted._id = { $oid: converted._id.toString() };
        }
        
        // Convert other ObjectId fields
        Object.keys(converted).forEach(key => {
          if (converted[key] && converted[key].toString && key !== '_id' && converted[key].constructor.name === 'ObjectId') {
            converted[key] = { $oid: converted[key].toString() };
          }
          
          // Convert dates
          if (converted[key] instanceof Date) {
            converted[key] = { $date: converted[key].toISOString() };
          }
        });
        
        return converted;
      });
      
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
      console.log(`Saved ${documents.length} documents to ${filePath}`);
    }
    
    console.log('JSON database population completed successfully!');
    
  } catch (error) {
    console.error('Error saving to JSON:', error);
    throw error;
  }
}

// Main execution
async function populateDatabase() {
  console.log('Starting database population...');
  console.log(`Using ${USE_JSON_FALLBACK ? 'JSON files' : 'MongoDB'}`);
  
  try {
    // Generate data
    console.log('Generating test data...');
    
    const users = generateUsers(100);
    const personnels = generatePersonnels(users);
    const trainings = generateTrainings(30);
    const activities = generateActivities(users, 50);
    const announcements = generateAnnouncements(users, 20);
    const policies = generatePolicies(users, 15);
    const auditLogs = generateAuditLogs(users, 100);
    const trainingRegistrations = generateTrainingRegistrations(users, trainings, 200);
    
    // Prepare data structure
    const data = {
      users,
      personnels,
      trainings,
      activities,
      announcements,
      policies,
      auditlogs: auditLogs,
      training_registrations: trainingRegistrations,
      trainingregistrations: trainingRegistrations, // Duplicate for compatibility
      companies: [], // Will be populated by existing data or separate script
      documents: [],
      documentmodels: [],
      'documents.chunks': [],
      'documents.files': [],
      'fs.chunks': [],
      'fs.files': [],
      'policyFiles.chunks': [],
      'policyFiles.files': [],
      rids: [],
      tokens: []
    };
    
    console.log('Data generation completed:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Personnel: ${personnels.length}`);
    console.log(`- Trainings: ${trainings.length}`);
    console.log(`- Activities: ${activities.length}`);
    console.log(`- Announcements: ${announcements.length}`);
    console.log(`- Policies: ${policies.length}`);
    console.log(`- Audit Logs: ${auditLogs.length}`);
    console.log(`- Training Registrations: ${trainingRegistrations.length}`);
    
    // Save to database
    if (USE_JSON_FALLBACK) {
      await saveToJSON(data);
    } else {
      await saveToMongoDB(data);
    }
    
  } catch (error) {
    console.error('Database population failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateDatabase().then(() => {
    console.log('Database population script completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { populateDatabase };

