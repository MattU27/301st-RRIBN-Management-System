# Company Management Scripts

This directory contains scripts for managing company data in the AFP Personnel Management System.

## Available Scripts

### 1. Update Personnel Status

Updates all personnel status to "Active" and ensures only approved companies exist.

```bash
node scripts/update-personnel-status.js
```

This script will:
- Update all personnel with "Standby" or "Retired" status to "Active"
- Remove any unauthorized companies from the database
- Ensure all approved companies exist

### 2. Sync Company Statistics

Triggers the API to recalculate and update company statistics.

```bash
node scripts/sync-companies.js
```

This script will:
- Connect to the API to trigger a sync operation
- Update readiness scores, document completion rates, and other statistics
- Requires an admin API token in your .env file

## Adding to .env File

For the sync script to work, add the following to your `.env` file:

```
API_TOKEN=your_admin_jwt_token
```

## Approved Companies

The system recognizes only these companies:
- Alpha
- Bravo
- Charlie
- Headquarters
- NERRSC (NERR-Signal Company)
- NERRFAB (NERR-Field Artillery Battery)

Any other companies will be automatically removed when running the update script. 