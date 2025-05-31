#!/usr/bin/env node

/**
 * MongoDB Installation Helper
 * 
 * This script provides instructions for installing MongoDB Community Edition
 * on different operating systems.
 */

const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Detect operating system
const platform = os.platform();
const release = os.release();

console.log('========== MongoDB Installation Helper ==========');
console.log(`Detected OS: ${platform} (${release})`);
console.log('');

// Instructions for different operating systems
const instructions = {
  win32: `
Windows Installation Instructions:
---------------------------------

1. Download the MongoDB Community Server installer:
   https://www.mongodb.com/try/download/community

2. Run the installer and follow the installation wizard.
   - Choose "Complete" setup type
   - Select "Install MongoDB as a Service"
   - Select "Run service as Network Service user"

3. Create a data directory if you didn't during installation:
   mkdir C:\\data\\db

4. Start MongoDB service:
   net start MongoDB

5. Verify installation:
   "C:\\Program Files\\MongoDB\\Server\\<version>\\bin\\mongo.exe"
   (replace <version> with your installed version)

For more detailed instructions, visit:
https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
`,

  darwin: `
macOS Installation Instructions:
------------------------------

Option 1: Using Homebrew (Recommended):
1. Install Homebrew if not already installed:
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

2. Tap the MongoDB Homebrew Tap:
   brew tap mongodb/brew

3. Install MongoDB Community Edition:
   brew install mongodb-community

4. Start MongoDB service:
   brew services start mongodb-community

5. Verify installation:
   mongosh

Option 2: Manual Installation:
   Visit: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/

For more detailed instructions, visit:
https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/
`,

  linux: `
Linux Installation Instructions:
-----------------------------

For Ubuntu:
----------
1. Import MongoDB public GPG key:
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

2. Create a list file for MongoDB:
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

3. Reload local package database:
   sudo apt-get update

4. Install MongoDB packages:
   sudo apt-get install -y mongodb-org

5. Start MongoDB service:
   sudo systemctl start mongod

6. Enable MongoDB to start on boot:
   sudo systemctl enable mongod

7. Verify installation:
   mongosh

For Red Hat / CentOS:
-------------------
1. Create a .repo file for MongoDB:
   sudo nano /etc/yum.repos.d/mongodb-org-6.0.repo

2. Add the following content:
   [mongodb-org-6.0]
   name=MongoDB Repository
   baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/6.0/x86_64/
   gpgcheck=1
   enabled=1
   gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc

3. Install MongoDB packages:
   sudo yum install -y mongodb-org

4. Start MongoDB service:
   sudo systemctl start mongod

5. Enable MongoDB to start on boot:
   sudo systemctl enable mongod

6. Verify installation:
   mongosh

For other Linux distributions, visit:
https://docs.mongodb.com/manual/administration/install-on-linux/
`,

  other: `
We couldn't automatically determine installation instructions for your operating system.

Please visit the MongoDB documentation for manual installation instructions:
https://docs.mongodb.com/manual/installation/
`
};

// Display installation instructions based on detected OS
function showInstructions() {
  if (platform === 'win32') {
    console.log(instructions.win32);
  } else if (platform === 'darwin') {
    console.log(instructions.darwin);
  } else if (platform === 'linux') {
    console.log(instructions.linux);
  } else {
    console.log(instructions.other);
  }
}

// Check if MongoDB is already installed
function checkMongoDBInstalled() {
  try {
    const output = execSync('mongod --version', { encoding: 'utf8' }).toString();
    console.log('MongoDB is already installed:');
    console.log(output.split('\n')[0]);
    
    rl.question('Do you still want to see installation instructions? (y/n): ', answer => {
      if (answer.toLowerCase() === 'y') {
        showInstructions();
      } else {
        console.log('\nExiting. MongoDB is already installed on your system.');
      }
      rl.close();
    });
  } catch (error) {
    console.log('MongoDB is not installed or not in your PATH.');
    showInstructions();
    
    console.log('\nAfter installation, please run our setup script:');
    console.log('node setup.js');
    rl.close();
  }
}

// Run the script
checkMongoDBInstalled();

// Handle script exit
rl.on('close', () => {
  console.log('\n========== MongoDB Installation Helper Completed ==========');
  process.exit(0);
}); 