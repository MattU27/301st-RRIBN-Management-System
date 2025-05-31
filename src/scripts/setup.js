#!/usr/bin/env node

/**
 * Setup script for database seeding
 * This script checks for and installs necessary dependencies for the seeding scripts.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Required packages for seeding
const REQUIRED_PACKAGES = [
  'mongoose',
  'dotenv',
  'ts-node',
  'typescript'
];

// Check if .env file exists at the project root
function checkEnvFile() {
  console.log('Checking for .env file...');
  
  // Get the project root (assumed to be 2 levels up from this script)
  const projectRoot = path.resolve(__dirname, '../..');
  const envPath = path.join(projectRoot, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('.env file not found! Creating a sample .env file...');
    
    const sampleEnvContent = 
`# Database Connection
MONGODB_URI=mongodb://localhost:27017/afp_personnel_db

# JWT Secret for Authentication
JWT_SECRET=your_jwt_secret_here

# App Settings
NEXT_PUBLIC_APP_NAME=AFP Personnel Management System
`;
    
    try {
      fs.writeFileSync(envPath, sampleEnvContent);
      console.log('Created sample .env file at project root. Please review and update the values.');
    } catch (error) {
      console.error('Error creating .env file:', error.message);
      console.log('Please create an .env file manually with the required environment variables.');
    }
  } else {
    console.log('.env file exists. Make sure it contains the necessary environment variables.');
  }
}

// Check installed packages
function checkDependencies() {
  console.log('Checking required dependencies...');
  
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found in the project root!');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { 
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };
  
  const missingPackages = REQUIRED_PACKAGES.filter(pkg => !dependencies[pkg]);
  
  if (missingPackages.length > 0) {
    console.log(`Installing missing dependencies: ${missingPackages.join(', ')}`);
    try {
      execSync(`npm install --save ${missingPackages.join(' ')}`, { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../..')
      });
      console.log('Dependencies installed successfully!');
    } catch (error) {
      console.error('Error installing dependencies:', error.message);
      process.exit(1);
    }
  } else {
    console.log('All required dependencies are already installed.');
  }
}

// Check for MongoDB connection
function checkMongoDB() {
  console.log('Checking MongoDB connection...');
  
  try {
    // Simple check to see if mongod is running
    const output = execSync('mongod --version', { encoding: 'utf8' }).toString();
    console.log('MongoDB is installed.');
    
    // Note: This doesn't guarantee MongoDB is running, just that it's installed
    console.log('Note: Make sure MongoDB service is running before executing the seed scripts.');
  } catch (error) {
    console.warn('Warning: MongoDB may not be installed or not in PATH.');
    console.warn('Please ensure MongoDB is installed and running before executing the seed scripts.');
  }
}

// Main setup function
function setup() {
  console.log('====== Setting up for database seeding ======');
  
  checkEnvFile();
  checkDependencies();
  checkMongoDB();
  
  console.log('\n====== Setup Completed ======');
  console.log('You can now run the seeding scripts:');
  console.log('  npx ts-node src/scripts/seedDatabase.ts');
  console.log('\nFor more information, see src/scripts/README.md');
}

// Run setup
setup(); 