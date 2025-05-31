// MongoDB script to add demo accounts
// Run with: mongosh localhost:27017/afp_personnel_db src/scripts/addDemoAccounts.js

// Connect to the database
print("Connected to AFP Personnel Database");

// Define enums for user roles
const UserRole = {
  RESERVIST: 'reservist',
  ENLISTED: 'enlisted',
  STAFF: 'staff',
  ADMIN: 'admin',
  DIRECTOR: 'director',
}

// Define user status
const UserStatus = {
  ACTIVE: 'active',
}

// Define military ranks
const MilitaryRank = {
  CORPORAL: 'Corporal',
  CAPTAIN: 'Captain',
  COLONEL: 'Colonel',
  BRIGADIER_GENERAL: 'Brigadier General',
}

// Define companies
const Company = {
  ALPHA: 'Alpha',
  BRAVO: 'Bravo',
  CHARLIE: 'Charlie',
  HQ: 'Headquarters',
}

// Direct bcrypt hash for 'password123' 
// This specific hash was generated using bcrypt.js and verified to work with bcrypt.compare
// Using salt format $2b$ instead of $2a$ which might be causing compatibility issues
const passwordHash = '$2b$10$bW3CfBvopkmE2hY3vdl6k.73cgWTJ311.ZpJ.KqKQ0UlvE3obNdgq';

// Define demo accounts as shown in the login screen
const demoAccounts = [
  {
    // 1. Reservist (CPT): juan.santos@army.mil.ph / password123
    firstName: 'Juan',
    lastName: 'Santos',
    email: 'juan.santos@army.mil.ph',
    password: passwordHash,
    role: UserRole.RESERVIST,
    status: UserStatus.ACTIVE,
    rank: MilitaryRank.CAPTAIN,
    company: Company.ALPHA,
    contactNumber: '+63912345678',
    dateOfBirth: new Date('1990-05-15'),
    specializations: ['Infantry', 'Reconnaissance'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    // 2. Staff (MAJ): maria.cruz@army.mil.ph / password123
    firstName: 'Maria',
    lastName: 'Cruz',
    email: 'maria.cruz@army.mil.ph',
    password: passwordHash,
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    rank: MilitaryRank.CAPTAIN,
    company: Company.HQ,
    contactNumber: '+63923456789',
    dateOfBirth: new Date('1985-07-23'),
    specializations: ['Personnel Management', 'Administration'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    // 3. Admin (COL): antonio.reyes@army.mil.ph / password123
    firstName: 'Antonio',
    lastName: 'Reyes',
    email: 'antonio.reyes@army.mil.ph',
    password: passwordHash,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    rank: MilitaryRank.COLONEL,
    company: Company.HQ,
    contactNumber: '+63934567890',
    dateOfBirth: new Date('1975-11-10'),
    specializations: ['Command Operations', 'Strategic Planning'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    // 4. Director (BGEN): roberto.delacruz@army.mil.ph / password123
    firstName: 'Roberto',
    lastName: 'Dela Cruz',
    email: 'roberto.delacruz@army.mil.ph',
    password: passwordHash,
    role: UserRole.DIRECTOR,
    status: UserStatus.ACTIVE,
    rank: MilitaryRank.BRIGADIER_GENERAL,
    company: Company.HQ,
    contactNumber: '+63945678901',
    dateOfBirth: new Date('1970-03-05'),
    specializations: ['Strategic Command', 'Executive Leadership'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// Insert or update demo accounts (upsert based on email)
demoAccounts.forEach(account => {
  // Check if account already exists
  const existingAccount = db.users.findOne({ email: account.email });
  
  if (existingAccount) {
    print(`Updating existing account: ${account.email}`);
    db.users.updateOne(
      { email: account.email },
      { $set: account }
    );
  } else {
    print(`Creating new account: ${account.email}`);
    db.users.insertOne(account);
  }
});

print("Demo accounts have been added to the database");

// Verify the accounts exist
const count = db.users.countDocuments({ 
  email: { 
    $in: [
      'juan.santos@army.mil.ph',
      'maria.cruz@army.mil.ph',
      'antonio.reyes@army.mil.ph',
      'roberto.delacruz@army.mil.ph'
    ] 
  } 
});

print(`Verified ${count} demo accounts are in the database`);

// Create indexes for better query performance if they don't exist already
db.users.createIndex({ email: 1 }, { unique: true });

print("Done"); 