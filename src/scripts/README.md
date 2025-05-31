# Database Seeding Scripts

This directory contains scripts to populate the database with sample data for testing and development purposes.

## Available Scripts

- `setup.js` - Prepares your environment by checking dependencies and configuration
- `installMongoDB.js` - Provides instructions for installing MongoDB on different operating systems
- `seedCompanies.ts` - Populates the database with sample company data
- `seedPersonnel.ts` - Populates the database with sample personnel data
- `runSeed.js` - JavaScript helper to run TypeScript seed scripts

## Prerequisites

### MongoDB Installation

If you don't have MongoDB installed, you can use our helper script to get installation instructions for your operating system:

```bash
# Option 1: Using npm script
npm run install:mongodb

# Option 2: Direct node execution
node installMongoDB.js
```

This interactive script will:
- Check if MongoDB is already installed
- Provide OS-specific installation instructions if needed
- Guide you through the MongoDB setup process

## TypeScript Execution

The seeding scripts are written in TypeScript but we've provided a JavaScript helper (`runSeed.js`) to simplify running them. This helper handles finding the correct path to ts-node and executes the TypeScript files properly.

## Quick Start

The simplest way to seed your database is to use the provided npm scripts:

```bash
# Change directory to the scripts folder
cd src/scripts

# Install dependencies if needed
npm install

# Run the complete process (setup + seeding)
npm run all
```

## Detailed Steps

### Step 1: Run the Setup Script

Before running any seeding scripts, first execute the setup script to prepare your environment:

```bash
npm run setup
```

This script will:
- Check if your `.env` file exists and create one if not found
- Verify that all required packages are installed
- Check if MongoDB is installed on your system

### Step 2: Verify MongoDB Connection

Make sure MongoDB is running and accessible. If you're using a local MongoDB instance:

Windows:
```
net start MongoDB
```

Mac/Linux:
```
sudo systemctl start mongod
```

### Step 3: Run the Database Seeding

To populate the database with sample data:

```bash
npm run seed
```

## Running Individual Scripts

To seed only companies:

```bash
npm run seed:companies
```

To seed only personnel:

```bash
npm run seed:personnel
```

**Note:** It's recommended to seed companies before personnel as the personnel records reference company codes.

## NPM Scripts Reference

The `package.json` file includes these convenient scripts:

| Script | Description |
|--------|-------------|
| `npm run setup` | Checks dependencies and environment |
| `npm run install:mongodb` | Provides MongoDB installation instructions |
| `npm run seed` | Runs all seeding scripts |
| `npm run seed:companies` | Seeds only company data |
| `npm run seed:personnel` | Seeds only personnel data |
| `npm run all` | Runs setup and complete seeding in one command |

## Sample Data

### Companies

The script creates 15 sample companies with the following data:
- Company name and code
- Description
- Location
- Commanding officer
- Personnel statistics
- Readiness scores

### Personnel

The script creates 500 sample personnel records with the following data:
- Name, rank, and service number
- Company assignment
- Status (Active, Standby, etc.)
- Contact information
- Document completion status
- Authentication credentials (default password: `changeme123`)

A special Director account is also created:
- Email: `director@afp.mil.ph`
- Password: `director@123`

## Customizing

To modify the sample data:
1. Edit the companies array in `seedCompanies.ts` to change company information
2. Edit the `generatePersonnel` function in `seedPersonnel.ts` to adjust personnel generation

## Troubleshooting

### TypeScript Execution Problems

If you encounter issues with TypeScript execution:

1. Make sure ts-node is properly installed:
   ```
   npm install -g ts-node typescript
   ```

2. Use the runSeed.js helper directly:
   ```
   node runSeed.js
   ```

3. Check that your TypeScript configuration is correct:
   ```
   npx tsc --version
   ```

### MongoDB Connection Issues

If you encounter issues:

1. Check your MongoDB connection (make sure MongoDB is running)
2. Verify the MONGODB_URI in your .env file
3. Check for console errors during script execution
4. Make sure you have the required dependencies installed

### Common Issues

#### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
This indicates MongoDB is not running. Start your MongoDB service.

#### Authentication Failed
```
MongoServerError: Authentication failed
```
Check your MONGODB_URI in the .env file. You may need to include authentication credentials.

#### Module Not Found
```
Error: Cannot find module 'mongoose'
```
Run `npm install mongoose` to install the missing package, or run the setup script again. 