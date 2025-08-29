# AFP Personnel Database Import

This guide helps you import all the JSON files from your `afp_personnel_db` folder into your MongoDB database.

## 📋 Prerequisites

- MongoDB running (local or remote)
- Node.js installed
- MongoDB Tools (for shell script method)

## 🚀 Import Methods

### Method 1: Node.js Script (Recommended)

The easiest method that uses your existing MongoDB connection:

```bash
# Using npm script
npm run import-db

# Or directly
node import_database.js
```

**Features:**
- Uses existing MongoDB connection settings
- Handles large files with batch processing
- Progress indicators for large collections
- Upsert functionality (updates existing records)
- Detailed import summary

### Method 2: Shell Script (Linux/Mac)

```bash
# Make executable
chmod +x import_database.sh

# Run the script
./import_database.sh
```

### Method 3: Windows Batch File

```cmd
# Double-click or run from command prompt
import_database.bat
```

## 📊 Data Being Imported

The script will import the following collections:

### Core Collections
- **personnels** - Personnel records and profiles
- **users** - User accounts and authentication
- **companies** - Military company/unit information
- **trainings** - Training programs and courses
- **training_registrations** - Training enrollment records
- **announcements** - System announcements
- **policies** - Policy documents
- **activities** - Activity logs
- **auditlogs** - Audit trail records

### File Storage Collections (GridFS)
- **documents** - Document storage
- **fs** - File system storage
- **policyFiles** - Policy file storage

### Other Collections
- **tokens** - Authentication tokens
- **rids** - RID documents
- **documentmodels** - Document templates

## ⚙️ Configuration

### Environment Variables

Set these if using non-default MongoDB settings:

```bash
# MongoDB connection string
export MONGODB_URI="mongodb://localhost:27017"

# For cloud MongoDB (Atlas)
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net"
```

### Database Settings

- **Database Name:** `afp_personnel_db`
- **Data Directory:** `./afp_personnel_db`
- **Batch Size:** 1000 documents (for large collections)

## 🔍 Verification

After import, verify your data:

1. **Check MongoDB Compass** or **Studio 3T**
2. **Use MongoDB shell:**
   ```bash
   mongo
   use afp_personnel_db
   show collections
   db.personnels.countDocuments()
   db.users.countDocuments()
   ```

3. **Test your application:**
   - Login with existing users
   - Generate promotion eligibility reports
   - Verify personnel data displays correctly

## 🚨 Important Notes

### Data Safety
- The script uses **upsert** mode - existing records are updated, not duplicated
- Always backup your existing database before importing
- Empty files are automatically skipped

### Large Files
- Personnel data contains ~1800+ records
- Training data contains ~4000+ records
- Import process uses batching for performance

### Common Issues

1. **MongoDB not running:**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **Solution:** Start MongoDB service

2. **Permission errors:**
   ```bash
   chmod +x import_database.sh
   ```

3. **Missing MongoDB tools:**
   ```bash
   # Ubuntu/Debian
   sudo apt install mongodb-database-tools
   
   # macOS
   brew install mongodb/brew/mongodb-database-tools
   
   # Windows
   # Download from: https://docs.mongodb.com/database-tools/installation/
   ```

## 🎯 Expected Results

After successful import, you should see:

```
✓ Successfully imported personnels (1800+ documents)
✓ Successfully imported users (120 documents)
✓ Successfully imported companies (345 documents)
✓ Successfully imported trainings (4000+ documents)
✓ Successfully imported announcements (8 documents)
... and more collections
```

## 🔄 Re-importing Data

The scripts are designed to be run multiple times safely:
- Existing records are updated with new data
- New records are added
- No data duplication occurs

## 🎉 Next Steps

1. **Test the promotion algorithm:**
   - Go to Analytics → Prescriptive Analytics
   - Click "Generate Promotion Eligibility"
   - Verify real data appears

2. **Check user logins:**
   - Test existing user accounts
   - Verify role-based access

3. **Validate company data:**
   - Ensure companies display correctly
   - Check personnel assignments

## 📞 Support

If you encounter issues:

1. Check MongoDB connection settings
2. Verify file permissions
3. Check MongoDB service status
4. Review import logs for specific errors

**Sample Success Output:**
```
================================================
  AFP Personnel Database Import Script
================================================

✓ MongoDB tools found
✓ Data directory found

Importing collections...

✓ Successfully imported personnels
✓ Successfully imported users
✓ Successfully imported companies
✓ Successfully imported trainings

================================================
  Database import completed successfully!
================================================
```
