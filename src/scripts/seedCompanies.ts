import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Company data
const companies = [
  {
    name: 'Alpha Company',
    code: 'ALPHA',
    description: 'Infantry unit specializing in frontline operations and rapid deployment.',
    location: 'Camp Aguinaldo, Quezon City',
    commandingOfficer: 'LTC Roberto Cruz',
    totalPersonnel: 45,
    activePersonnel: 38,
    readinessScore: 87,
    documentsComplete: 92,
    trainingsComplete: 85
  },
  {
    name: 'Bravo Company',
    code: 'BRAVO',
    description: 'Combat support unit providing artillery and tactical assistance.',
    location: 'Fort Bonifacio, Taguig City',
    commandingOfficer: 'MAJ Elena Santos',
    totalPersonnel: 52,
    activePersonnel: 48,
    readinessScore: 92,
    documentsComplete: 96,
    trainingsComplete: 90
  },
  {
    name: 'Charlie Company',
    code: 'CHARLIE',
    description: 'Specialized unit focusing on urban combat and close-quarters operations.',
    location: 'Camp Lapu-Lapu, Cebu City',
    commandingOfficer: 'MAJ Antonio Reyes',
    totalPersonnel: 38,
    activePersonnel: 32,
    readinessScore: 76,
    documentsComplete: 82,
    trainingsComplete: 74
  },
  {
    name: 'Delta Company',
    code: 'DELTA',
    description: 'Reconnaissance and surveillance unit operating in high-risk environments.',
    location: 'Camp General Emilio Aguinaldo, Cavite',
    commandingOfficer: 'MAJ Francisco Magsaysay',
    totalPersonnel: 35,
    activePersonnel: 30,
    readinessScore: 79,
    documentsComplete: 84,
    trainingsComplete: 77
  },
  {
    name: 'Echo Company',
    code: 'ECHO',
    description: 'Support unit providing logistics and supply chain management.',
    location: 'Camp General Servillano Aquino, Tarlac',
    commandingOfficer: 'CPT Maria Lourdes Tan',
    totalPersonnel: 40,
    activePersonnel: 34,
    readinessScore: 80,
    documentsComplete: 85,
    trainingsComplete: 78
  },
  {
    name: 'Headquarters',
    code: 'HQ',
    description: 'Command and control center for all operations and strategic planning.',
    location: 'Camp Aguinaldo, Quezon City',
    commandingOfficer: 'COL Manuel Gomez',
    totalPersonnel: 24,
    activePersonnel: 22,
    readinessScore: 94,
    documentsComplete: 98,
    trainingsComplete: 92
  },
  {
    name: 'NERRSC (NERR-Signal Company)',
    code: 'NERRSC',
    description: 'Communications and signal intelligence unit supporting tactical operations.',
    location: 'Fort Magsaysay, Nueva Ecija',
    commandingOfficer: 'MAJ Rodrigo Duterte',
    totalPersonnel: 32,
    activePersonnel: 27,
    readinessScore: 85,
    documentsComplete: 88,
    trainingsComplete: 84
  },
  {
    name: 'NERRFAB (NERR-Field Artillery Battery)',
    code: 'NERRFAB',
    description: 'Artillery support unit specializing in long-range fire support.',
    location: 'Fort Magsaysay, Nueva Ecija',
    commandingOfficer: 'MAJ Paolo Santiago',
    totalPersonnel: 28,
    activePersonnel: 24,
    readinessScore: 82,
    documentsComplete: 84,
    trainingsComplete: 81
  },
  {
    name: 'Foxtrot Company',
    code: 'FOXTROT',
    description: 'Specialized infantry unit focused on jungle and mountain warfare.',
    location: 'Camp Capinpin, Tanay, Rizal',
    commandingOfficer: 'MAJ Ricardo Dalisay',
    totalPersonnel: 42,
    activePersonnel: 37,
    readinessScore: 88,
    documentsComplete: 90,
    trainingsComplete: 86
  },
  {
    name: 'Golf Company',
    code: 'GOLF',
    description: 'Rapid response unit trained for immediate deployment in crisis situations.',
    location: 'Camp General Arturo Enrile, Malagutay, Zamboanga City',
    commandingOfficer: 'MAJ Fernando Basco',
    totalPersonnel: 38,
    activePersonnel: 33,
    readinessScore: 86,
    documentsComplete: 88,
    trainingsComplete: 85
  },
  {
    name: 'Hotel Company',
    code: 'HOTEL',
    description: 'Security and defense unit specializing in base protection and perimeter control.',
    location: 'Camp General Mateo Capinpin, Tanay, Rizal',
    commandingOfficer: 'CPT Josefina Lopez',
    totalPersonnel: 36,
    activePersonnel: 31,
    readinessScore: 82,
    documentsComplete: 85,
    trainingsComplete: 80
  },
  {
    name: 'Medical Corps',
    code: 'MEDCORP',
    description: 'Medical support unit providing healthcare services to military personnel.',
    location: 'V. Luna Medical Center, Quezon City',
    commandingOfficer: 'LTC Dr. Benjamin Abalos',
    totalPersonnel: 45,
    activePersonnel: 42,
    readinessScore: 93,
    documentsComplete: 97,
    trainingsComplete: 91
  },
  {
    name: 'Engineering Battalion',
    code: 'ENGBAT',
    description: 'Specialized unit for construction, demolition, and field fortifications.',
    location: 'Fort Bonifacio, Taguig City',
    commandingOfficer: 'LTC Eduardo Villanueva',
    totalPersonnel: 60,
    activePersonnel: 53,
    readinessScore: 88,
    documentsComplete: 91,
    trainingsComplete: 87
  },
  {
    name: 'Intelligence Division',
    code: 'INTELDIV',
    description: 'Intelligence gathering and analysis unit supporting operational planning.',
    location: 'Camp Aguinaldo, Quezon City',
    commandingOfficer: 'COL Antonio Parlade',
    totalPersonnel: 30,
    activePersonnel: 28,
    readinessScore: 92,
    documentsComplete: 95,
    trainingsComplete: 90
  },
  {
    name: 'Airborne Company',
    code: 'AIRBORNE',
    description: 'Elite paratrooper unit specialized in air assault and airborne operations.',
    location: 'Fort Magsaysay, Nueva Ecija',
    commandingOfficer: 'MAJ Alexander Santos',
    totalPersonnel: 48,
    activePersonnel: 43,
    readinessScore: 90,
    documentsComplete: 93,
    trainingsComplete: 88
  }
];

// Create a schema for the Company model
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  location: { type: String },
  commandingOfficer: { type: String },
  totalPersonnel: { type: Number, default: 0 },
  activePersonnel: { type: Number, default: 0 },
  readinessScore: { type: Number, default: 0 },
  documentsComplete: { type: Number, default: 0 },
  trainingsComplete: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Main seeding function
async function seedCompanies() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Register the Company model
    const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

    // Clear existing companies
    console.log('Clearing existing companies...');
    await Company.deleteMany({});
    console.log('Existing companies cleared');

    // Insert new companies
    console.log(`Inserting ${companies.length} companies...`);
    await Company.insertMany(companies);
    console.log('Companies inserted successfully');

    // Count the number of companies
    const count = await Company.countDocuments();
    console.log(`Database now has ${count} companies`);

    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedCompanies(); 