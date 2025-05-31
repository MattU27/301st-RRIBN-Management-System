// Direct MongoDB personnel creation script
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string - IMPORTANT: Use the correct database name with underscore
const MONGODB_URI = 'mongodb://localhost:27017/afp_personnel_db';

console.log('Using MongoDB URI:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define Personnel Schema - must match exactly the one used in the application
const PersonnelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  rank: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'retired', 'standby', 'ready'],
    default: 'active',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  dateJoined: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ['reservist', 'enlisted', 'staff', 'admin', 'director'],
    default: 'reservist',
  },
  serviceNumber: {
    type: String,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
  },
  specialization: [{
    type: String,
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    contactNumber: String,
  },
}, {
  timestamps: true,
});

// Create Personnel model with EXACT collection name
// Important: collection name must be 'personnels' to match what the app is using
const Personnel = mongoose.model('Personnel', PersonnelSchema, 'personnels');

// Filipino personnel data focusing on reservists
const filipinoPersonnel = [
  {
    name: 'Ricardo Santos Dela Cruz',
    rank: 'Colonel',
    company: 'Headquarters',
    status: 'active',
    email: 'rsdelacruz@afppms.mil',
    phoneNumber: '+63 915 789 1234',
    dateJoined: new Date('2005-06-15'),
    role: 'admin',
    serviceNumber: 'AFP-123456',
    specialization: ['Strategic Planning', 'Intelligence'],
    address: {
      street: '123 Mabini Street',
      city: 'Quezon City',
      province: 'Metro Manila',
      postalCode: '1100'
    },
    emergencyContact: {
      name: 'Maria Dela Cruz',
      relationship: 'Spouse',
      contactNumber: '+63 917 456 7890'
    }
  },
  {
    name: 'Maria Luisa Reyes',
    rank: 'Major',
    company: 'Alpha',
    status: 'active',
    email: 'mlreyes@afppms.mil',
    phoneNumber: '+63 918 234 5678',
    dateJoined: new Date('2010-03-22'),
    role: 'staff',
    serviceNumber: 'AFP-234567',
    specialization: ['Logistics', 'Operations Planning'],
    address: {
      street: '456 Rizal Avenue',
      city: 'Makati City',
      province: 'Metro Manila',
      postalCode: '1200'
    },
    emergencyContact: {
      name: 'Jose Reyes',
      relationship: 'Father',
      contactNumber: '+63 919 567 8901'
    }
  },
  {
    name: 'Sofia Dimaculangan',
    rank: 'Second Lieutenant',
    company: 'Charlie',
    status: 'standby',
    email: 'sdimaculangan@afppms.mil',
    phoneNumber: '+63 922 456 7890',
    dateJoined: new Date('2020-01-05'),
    role: 'reservist',
    serviceNumber: 'AFP-456789',
    specialization: ['Communications', 'Cybersecurity'],
    address: {
      street: '234 Bonifacio Street',
      city: 'Pasig City',
      province: 'Metro Manila',
      postalCode: '1600'
    },
    emergencyContact: {
      name: 'Roberto Dimaculangan',
      relationship: 'Brother',
      contactNumber: '+63 923 789 0123'
    }
  },
  {
    name: 'Eduardo Magbanua',
    rank: 'Master Sergeant',
    company: 'NERRFAB (NERR-Field Artillery Battery)',
    status: 'ready',
    email: 'emagbanua@afppms.mil',
    phoneNumber: '+63 926 678 9012',
    dateJoined: new Date('2008-09-30'),
    role: 'enlisted',
    serviceNumber: 'AFP-678901',
    specialization: ['Artillery Systems', 'Weapons Training'],
    address: {
      street: '890 Del Pilar Street',
      city: 'Bacoor',
      province: 'Cavite',
      postalCode: '4102'
    },
    emergencyContact: {
      name: 'Angelica Magbanua',
      relationship: 'Spouse',
      contactNumber: '+63 927 901 2345'
    }
  },
  {
    name: 'Jericho Mendoza',
    rank: 'Captain',
    company: 'Alpha',
    status: 'active',
    email: 'jmendoza@afppms.mil',
    phoneNumber: '+63 928 789 0123',
    dateJoined: new Date('2012-05-14'),
    role: 'staff',
    serviceNumber: 'AFP-789012',
    specialization: ['Infantry Tactics', 'Close Quarters Combat'],
    address: {
      street: '123 Magsaysay Blvd',
      city: 'Manila',
      province: 'Metro Manila',
      postalCode: '1000'
    },
    emergencyContact: {
      name: 'Isabel Mendoza',
      relationship: 'Spouse',
      contactNumber: '+63 929 012 3456'
    }
  },
  // Additional reservists
  {
    name: 'Antonio Villanueva',
    rank: 'First Lieutenant',
    company: 'NERRSC (NERR-Signal Company)',
    status: 'standby',
    email: 'avillanueva@afppms.mil',
    phoneNumber: '+63 917 123 4567',
    dateJoined: new Date('2019-05-12'),
    role: 'reservist',
    serviceNumber: 'AFP-567123',
    specialization: ['Signal Intelligence', 'Communications'],
    address: {
      street: '45 Rizal Street',
      city: 'Caloocan City',
      province: 'Metro Manila',
      postalCode: '1400'
    },
    emergencyContact: {
      name: 'Marissa Villanueva',
      relationship: 'Spouse',
      contactNumber: '+63 917 987 6543'
    }
  },
  {
    name: 'Teresa Santos',
    rank: 'Second Lieutenant',
    company: 'Bravo',
    status: 'standby',
    email: 'tsantos@afppms.mil',
    phoneNumber: '+63 918 765 4321',
    dateJoined: new Date('2021-02-15'),
    role: 'reservist',
    serviceNumber: 'AFP-789456',
    specialization: ['Medical Support', 'First Aid Training'],
    address: {
      street: '78 Aurora Blvd',
      city: 'Quezon City',
      province: 'Metro Manila',
      postalCode: '1112'
    },
    emergencyContact: {
      name: 'Miguel Santos',
      relationship: 'Father',
      contactNumber: '+63 918 222 3333'
    }
  },
  {
    name: 'Gabriel Fernandez',
    rank: 'Corporal',
    company: 'Charlie',
    status: 'ready',
    email: 'gfernandez@afppms.mil',
    phoneNumber: '+63 919 333 4444',
    dateJoined: new Date('2018-07-22'),
    role: 'reservist',
    serviceNumber: 'AFP-234987',
    specialization: ['Infantry', 'Reconnaissance'],
    address: {
      street: '123 Commonwealth Avenue',
      city: 'Quezon City',
      province: 'Metro Manila',
      postalCode: '1119'
    },
    emergencyContact: {
      name: 'Lucia Fernandez',
      relationship: 'Sister',
      contactNumber: '+63 919 555 6666'
    }
  },
  {
    name: 'Maricel Ramos',
    rank: 'Sergeant',
    company: 'NERRFAB (NERR-Field Artillery Battery)',
    status: 'ready',
    email: 'mramos@afppms.mil',
    phoneNumber: '+63 920 888 9999',
    dateJoined: new Date('2016-04-18'),
    role: 'reservist',
    serviceNumber: 'AFP-345678',
    specialization: ['Artillery', 'Training'],
    address: {
      street: '56 Marcos Highway',
      city: 'Marikina City',
      province: 'Metro Manila',
      postalCode: '1800'
    },
    emergencyContact: {
      name: 'Ricardo Ramos',
      relationship: 'Father',
      contactNumber: '+63 920 777 8888'
    }
  },
  {
    name: 'Paolo De Guzman',
    rank: 'Staff Sergeant',
    company: 'Alpha',
    status: 'active',
    email: 'pdeguzman@afppms.mil',
    phoneNumber: '+63 921 444 5555',
    dateJoined: new Date('2014-11-10'),
    role: 'reservist',
    serviceNumber: 'AFP-456123',
    specialization: ['Combat Training', 'Tactics'],
    address: {
      street: '89 Gil Puyat Avenue',
      city: 'Makati City',
      province: 'Metro Manila',
      postalCode: '1200'
    },
    emergencyContact: {
      name: 'Carla De Guzman',
      relationship: 'Spouse',
      contactNumber: '+63 921 333 2222'
    }
  },
  {
    name: 'Jasmine Lim',
    rank: 'Private First Class',
    company: 'NERRSC (NERR-Signal Company)',
    status: 'active',
    email: 'jlim@afppms.mil',
    phoneNumber: '+63 922 111 2222',
    dateJoined: new Date('2022-01-10'),
    role: 'reservist',
    serviceNumber: 'AFP-987654',
    specialization: ['Cyber Operations', 'IT Support'],
    address: {
      street: '123 Timog Avenue',
      city: 'Quezon City',
      province: 'Metro Manila',
      postalCode: '1103'
    },
    emergencyContact: {
      name: 'Manuel Lim',
      relationship: 'Father',
      contactNumber: '+63 922 333 4444'
    }
  },
  {
    name: 'Fernando Reyes',
    rank: 'Sergeant',
    company: 'Bravo',
    status: 'standby',
    email: 'freyes@afppms.mil',
    phoneNumber: '+63 923 555 6666',
    dateJoined: new Date('2015-09-15'),
    role: 'reservist',
    serviceNumber: 'AFP-321654',
    specialization: ['Special Operations', 'Urban Warfare'],
    address: {
      street: '45 Katipunan Avenue',
      city: 'Quezon City',
      province: 'Metro Manila',
      postalCode: '1108'
    },
    emergencyContact: {
      name: 'Cecilia Reyes',
      relationship: 'Mother',
      contactNumber: '+63 923 777 8888'
    }
  }
];

// Function to seed the database
async function seedDatabase() {
  try {
    console.log('🔄 Preparing to insert personnel records...');
    
    // Wait for MongoDB connection to be fully established
    await mongoose.connection.asPromise();
    
    console.log('🔄 Clearing existing personnel records...');
    
    // Delete all documents from the personnels collection
    await Personnel.deleteMany({});
    
    console.log('🌱 Adding Filipino personnel records...');
    const result = await Personnel.insertMany(filipinoPersonnel);
    
    console.log(`✅ Successfully added ${result.length} personnel records!`);
    console.log('✅ Personnel records summary:');
    console.log(`   - Reservists: ${result.filter(p => p.role === 'reservist').length}`);
    console.log(`   - Enlisted: ${result.filter(p => p.role === 'enlisted').length}`);
    console.log(`   - Staff: ${result.filter(p => p.role === 'staff').length}`);
    console.log(`   - Admin: ${result.filter(p => p.role === 'admin').length}`);
    console.log(`   - Director: ${result.filter(p => p.role === 'director').length}`);
    
    // Verify the data was inserted correctly
    const count = await Personnel.countDocuments();
    console.log(`✅ Collection 'personnels' now has ${count} documents.`);
    
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Run the function
seedDatabase(); 