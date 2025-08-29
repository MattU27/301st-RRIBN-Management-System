# AFP Personnel Management System - Database Population

This directory contains scripts to populate the AFP Personnel Management System database with realistic test data.

## Quick Start

### For Linux/macOS:
```bash
# Make script executable (if not already)
chmod +x populate-db.sh

# Run with default settings (tries MongoDB first, falls back to JSON)
./populate-db.sh

# Or use JSON files directly
./populate-db.sh --json-fallback
```

### For Windows:
```cmd
# Run with default settings
populate-db.bat

# Or use JSON files directly
populate-db.bat --json-fallback
```

### Alternative using Node.js directly:
```bash
# Install dependencies first
npm install

# For MongoDB
node scripts/populate-database.js

# For JSON files
USE_JSON_FALLBACK=true node scripts/populate-database.js
```

## What Gets Populated

The script generates realistic test data for:

### Core Collections:
- **Users** (100 records) - System users with different roles
- **Personnel** (100 records) - Military personnel data
- **Companies** - Military unit information
- **Trainings** (30 records) - Training programs and courses
- **Activities** (50 records) - User activity logs
- **Announcements** (20 records) - System announcements
- **Policies** (15 records) - Military policies and guidelines
- **Audit Logs** (100 records) - System audit trail
- **Training Registrations** (200 records) - Personnel training enrollments

### Empty Collections (Ready for File Uploads):
- Documents and file chunks
- Policy files
- RIDs (Reserve Individual Data Sheets)
- Authentication tokens

## Generated Data Details

### Users & Personnel
- **Realistic Filipino names** from common military personnel
- **Military ranks** from Private to General
- **Service numbers** in format YYYY-NNNNN
- **Companies** including Alpha, Bravo, Charlie, Headquarters, NERRSC, NERRFAB
- **Email addresses** following military convention (firstname.lastname@mil.ph)
- **Phone numbers** and addresses
- **Various statuses** (Active, Inactive, Ready, Not Ready, etc.)

### Trainings
- **Military training types** (Basic Combat, Advanced Infantry, Leadership, etc.)
- **Realistic locations** (Camp Aguinaldo, Fort Bonifacio, etc.)
- **Training schedules** with proper date ranges
- **Instructor information** with military ranks
- **Capacity and registration tracking**

### Announcements
- **Military-themed content** (Security updates, training schedules, etc.)
- **Priority levels** (Low, Medium, High, Urgent)
- **Target audiences** (specific companies or roles)
- **Publication and expiry dates**

### Policies
- **Military policy categories** (Personnel, Training, Equipment, etc.)
- **Version control** and status tracking
- **Effective dates** and approval workflows

## Configuration Options

### Environment Variables:
```bash
# MongoDB connection (default: mongodb://localhost:27017/afp_personnel_db)
export MONGODB_URI="mongodb://username:password@host:port/database"

# Use JSON files instead of MongoDB
export USE_JSON_FALLBACK=true

# Set environment
export NODE_ENV=development
```

### Command Line Options:
```bash
# Use JSON files
./populate-db.sh --json-fallback

# Custom MongoDB URI
./populate-db.sh --mongodb-uri "mongodb://user:pass@host:port/db"

# Skip backup creation
./populate-db.sh --no-backup

# Show help
./populate-db.sh --help
```

## Backup and Safety

### Automatic Backups:
- **JSON mode**: Creates timestamped backup of `afp_personnel_db/` directory
- **MongoDB mode**: Attempts to create mongodump backup
- **Backup location**: `afp_personnel_db_backup_YYYYMMDD_HHMMSS/`

### Data Safety:
- Script **clears existing data** before population
- Always creates backup unless `--no-backup` is specified
- Validates Node.js version (requires 16+)
- Checks database connectivity before proceeding

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   ```
   Solution: Script automatically falls back to JSON mode
   Or manually use: --json-fallback flag
   ```

2. **Node.js Version Error**
   ```
   Error: Node.js version 16 or higher required
   Solution: Update Node.js to version 16+
   ```

3. **Permission Denied (Linux/macOS)**
   ```
   Solution: chmod +x populate-db.sh
   ```

4. **Missing Dependencies**
   ```
   Solution: npm install
   Script also auto-installs missing packages
   ```

### Manual Verification:

#### For JSON Database:
```bash
# Check if files were created
ls -la afp_personnel_db/

# Count users
grep -o '"_id"' afp_personnel_db/afp_personnel_db.users.json | wc -l

# Count trainings
grep -o '"_id"' afp_personnel_db/afp_personnel_db.trainings.json | wc -l
```

#### For MongoDB:
```bash
# Connect to MongoDB
mongo afp_personnel_db
# or
mongosh afp_personnel_db

# Check collections
show collections

# Count documents
db.users.countDocuments()
db.trainings.countDocuments()
```

## File Structure

```
├── scripts/
│   ├── populate-database.js     # Main population script
│   └── DATABASE_POPULATION_README.md
├── populate-db.sh              # Linux/macOS shell script
├── populate-db.bat             # Windows batch script
└── afp_personnel_db/           # JSON database files (created)
    ├── afp_personnel_db.users.json
    ├── afp_personnel_db.trainings.json
    └── ... (other collections)
```

## Integration with Application

After population, you can start the application:

```bash
# Start development server
npm run dev

# Or production mode
npm start
```

The application will automatically:
- Detect JSON files if MongoDB is unavailable
- Connect to MongoDB if available
- Use the populated data for testing

## Customization

To modify the generated data:

1. **Edit data generators** in `scripts/populate-database.js`
2. **Adjust counts** by changing the numbers in generate functions
3. **Add new data types** by creating additional generator functions
4. **Modify existing patterns** by updating the arrays (names, companies, etc.)

Example customization:
```javascript
// In scripts/populate-database.js
const users = generateUsers(200);  // Generate 200 users instead of 100
const trainings = generateTrainings(50);  // Generate 50 trainings instead of 30
```

## Support

For issues or questions:
1. Check this README for common solutions
2. Verify all prerequisites are installed
3. Try running with `--json-fallback` if MongoDB issues persist
4. Check the generated log files for detailed error information

