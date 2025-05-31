import mongoose from 'mongoose';
import { config } from 'dotenv';
import crypto from 'crypto';

// Load environment variables from .env file
config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Military ranks by branch
const ranks = {
  army: [
    'PVT', 'PFC', 'CPL', 'SGT', 'SSG', 'SFC', 'MSG', '1SG', 'SGM', 'CSM',
    '2LT', '1LT', 'CPT', 'MAJ', 'LTC', 'COL', 'BG', 'MG', 'LTG', 'GEN'
  ],
  airForce: [
    'AB', 'A1C', 'SRA', 'SGT', 'SSG', 'TSG', 'MSG', 'SMSgt', 'CMSgt', 'CCM',
    '2LT', '1LT', 'CPT', 'MAJ', 'LTC', 'COL', 'BG', 'MG', 'LTG', 'GEN'
  ],
  navy: [
    'SR', 'SA', 'SN', 'PO3', 'PO2', 'PO1', 'CPO', 'SCPO', 'MCPO', 'FMCPO',
    'ENS', 'LTJG', 'LT', 'LCDR', 'CDR', 'CAPT', 'RDML', 'RADM', 'VADM', 'ADM'
  ]
};

// Status options
const statuses = ['Active', 'Standby', 'Leave', 'Training', 'Medical', 'Deployed', 'Retired'];

// Company codes from the seedCompanies script
const companyCodes = [
  'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'HQ', 'NERRSC', 'NERRFAB',
  'FOXTROT', 'GOLF', 'HOTEL', 'MEDCORP', 'ENGBAT', 'INTELDIV', 'AIRBORNE'
];

// Generate a random date between start and end dates
function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate a random phone number
function randomPhoneNumber() {
  return `+63${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
}

// Generate a random service number
function randomServiceNumber() {
  return `${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}

// Generate a random Philippine address
function randomAddress() {
  const streets = [
    'Rizal Avenue', 'Mabini Street', 'Bonifacio Street', 'Aguinaldo Highway',
    'EDSA', 'Taft Avenue', 'Roxas Boulevard', 'Quezon Avenue', 'Marcos Highway'
  ];
  const cities = [
    'Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Cebu City', 
    'Davao City', 'Baguio City', 'Iloilo City', 'Zamboanga City'
  ];
  const streetNumber = Math.floor(Math.random() * 1000) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  return `${streetNumber} ${street}, ${city}, Philippines`;
}

// Generate a list of random personnel
function generatePersonnel(count: number) {
  const personnel = [];
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setFullYear(currentDate.getFullYear() - 15); // 15 years ago for the earliest join date
  
  const firstNames = [
    'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Antonio', 'Elena', 'Francisco',
    'Josefina', 'Ricardo', 'Lourdes', 'Miguel', 'Carmen', 'Eduardo', 'Sofia', 'Manuel',
    'Angelica', 'Rafael', 'Beatriz', 'Carlos', 'Victoria', 'Luis', 'Teresa', 'Roberto',
    'Patricia', 'Fernando', 'Rosario', 'Rodrigo', 'Cristina'
  ];
  
  const lastNames = [
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Mendoza', 'Garcia', 'Torres', 'Flores',
    'Gonzales', 'Diaz', 'Ramos', 'Aquino', 'Villanueva', 'Fernandez', 'Morales',
    'Marquez', 'Castro', 'Navarro', 'Domingo', 'Salazar', 'Lopez', 'Tan', 'Lim',
    'Sy', 'Co', 'Ang', 'Pascual', 'Galang', 'Dela Cruz', 'Del Rosario'
  ];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    
    // Select a random branch and rank
    const branches = Object.keys(ranks);
    const branch = branches[Math.floor(Math.random() * branches.length)] as keyof typeof ranks;
    const rank = ranks[branch][Math.floor(Math.random() * ranks[branch].length)];
    
    // Determine if this is an officer based on the rank
    const isOfficer = ranks[branch].indexOf(rank) >= 10; // First 10 are enlisted, next 10 are officers
    
    // Select a random company, with a bias towards assigning officers to HQ
    let companyCode;
    if (isOfficer && Math.random() < 0.3) {
      companyCode = 'HQ'; // 30% chance for officers to be in HQ
    } else {
      companyCode = companyCodes[Math.floor(Math.random() * companyCodes.length)];
    }
    
    // Generate email based on name
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@afp.mil.ph`;
    
    // Generate random dates
    const dateJoined = randomDate(startDate, currentDate);
    
    // More likely to be active if recently joined
    const yearsOfService = (currentDate.getTime() - dateJoined.getTime()) / (1000 * 60 * 60 * 24 * 365);
    let statusProbabilities;
    
    if (yearsOfService < 2) {
      statusProbabilities = [0.8, 0.05, 0.05, 0.1, 0.0, 0.0, 0.0]; // More likely active or training
    } else if (yearsOfService < 5) {
      statusProbabilities = [0.7, 0.1, 0.05, 0.05, 0.05, 0.05, 0.0];
    } else if (yearsOfService < 10) {
      statusProbabilities = [0.6, 0.1, 0.05, 0.05, 0.1, 0.1, 0.0];
    } else {
      statusProbabilities = [0.5, 0.1, 0.05, 0.05, 0.1, 0.1, 0.1]; // Higher chance of retirement
    }
    
    // Select status based on probabilities
    let statusIndex = 0;
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    
    for (let j = 0; j < statusProbabilities.length; j++) {
      cumulativeProbability += statusProbabilities[j];
      if (randomValue <= cumulativeProbability) {
        statusIndex = j;
        break;
      }
    }
    
    const status = statuses[statusIndex];
    
    // Generate password hash
    const salt = crypto.randomBytes(16).toString('hex');
    const defaultPassword = "changeme123";
    const hash = crypto.pbkdf2Sync(defaultPassword, salt, 1000, 64, 'sha512').toString('hex');
    
    personnel.push({
      name: fullName,
      rank: rank,
      serviceNumber: randomServiceNumber(),
      company: companyCode,
      status: status,
      email: email,
      password: {
        hash: hash,
        salt: salt
      },
      role: isOfficer ? (Math.random() < 0.2 ? 'admin' : 'staff') : 'user', // 20% of officers are admins, rest are staff
      phone: randomPhoneNumber(),
      address: randomAddress(),
      dateJoined: dateJoined,
      emergencyContact: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      emergencyPhone: randomPhoneNumber(),
      documents: {
        id: Math.random() > 0.2, // 80% have ID
        medicalRecord: Math.random() > 0.3, // 70% have medical records
        training: Math.random() > 0.4, // 60% have training documents
        security: Math.random() > 0.3 // 70% have security clearance
      }
    });
  }
  
  return personnel;
}

// Create a schema for the Personnel model
const PersonnelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rank: { type: String, required: true },
  serviceNumber: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  status: { type: String, required: true, enum: statuses },
  email: { type: String, required: true, unique: true },
  password: {
    hash: { type: String, required: true },
    salt: { type: String, required: true }
  },
  role: { type: String, required: true, enum: ['user', 'staff', 'admin', 'director'], default: 'user' },
  phone: { type: String },
  address: { type: String },
  dateJoined: { type: Date, required: true },
  emergencyContact: { type: String },
  emergencyPhone: { type: String },
  documents: {
    id: { type: Boolean, default: false },
    medicalRecord: { type: Boolean, default: false },
    training: { type: Boolean, default: false },
    security: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create a director account
const directorAccount = {
  name: 'Director General',
  rank: 'GEN',
  serviceNumber: '000001',
  company: 'HQ',
  status: 'Active',
  email: 'director@afp.mil.ph',
  password: {
    hash: crypto.pbkdf2Sync('director@123', 'directorsalt', 1000, 64, 'sha512').toString('hex'),
    salt: 'directorsalt'
  },
  role: 'director',
  phone: '+639123456789',
  address: '1 Aguinaldo Street, Camp Aguinaldo, Quezon City, Philippines',
  dateJoined: new Date('2000-01-01'),
  emergencyContact: 'Emergency Contact',
  emergencyPhone: '+639987654321',
  documents: {
    id: true,
    medicalRecord: true,
    training: true,
    security: true
  }
};

// Main seeding function
async function seedPersonnel() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Register the Personnel model
    const Personnel = mongoose.models.Personnel || mongoose.model('Personnel', PersonnelSchema);

    // Clear existing personnel
    console.log('Clearing existing personnel...');
    await Personnel.deleteMany({});
    console.log('Existing personnel cleared');

    // Generate 500 random personnel records
    const personnel = generatePersonnel(500);
    
    // Add director account
    personnel.push(directorAccount);

    // Insert personnel records
    console.log(`Inserting ${personnel.length} personnel records...`);
    await Personnel.insertMany(personnel);
    console.log('Personnel records inserted successfully');

    // Count the number of personnel
    const count = await Personnel.countDocuments();
    console.log(`Database now has ${count} personnel records`);

    // Update company totalPersonnel and activePersonnel counts
    const CompanySchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      code: { type: String, required: true, unique: true },
      totalPersonnel: { type: Number, default: 0 },
      activePersonnel: { type: Number, default: 0 }
    });

    const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
    
    // Get counts per company
    console.log('Updating company personnel counts...');
    
    for (const companyCode of companyCodes) {
      const totalCount = await Personnel.countDocuments({ company: companyCode });
      const activeCount = await Personnel.countDocuments({ company: companyCode, status: 'Active' });
      
      await Company.updateOne(
        { code: companyCode },
        { $set: { totalPersonnel: totalCount, activePersonnel: activeCount } }
      );
      
      console.log(`Updated ${companyCode}: Total=${totalCount}, Active=${activeCount}`);
    }

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
seedPersonnel(); 