# How to Fix Document Uploader Issue

This guide explains how to fix the issue where documents uploaded by John Matthew Banto are incorrectly showing as uploaded by Javier Velasco.

## The Issue

When documents are uploaded from the mobile app using John Matthew Banto's account, they are incorrectly displaying Javier Velasco as the uploader in the web interface. This happens because:

1. The document records have Javier Velasco's user ID (`680644b64c09aeb74f457347`)
2. But they have John Matthew Banto's name in the `uploadedBy` field
3. The service number and company information in `uploadedBy` are also incorrect

## Solution 1: Direct Database Edit

We've already updated the database files directly:

- `afp_personnel_db/afp_personnel_db.documents.json` has been updated with the correct information

## Solution 2: Run the MongoDB Fix Script

To fix all documents in the MongoDB database:

### On Windows:

1. Open a Command Prompt
2. Navigate to the project directory
3. Run the batch file:
   ```
   run_fix.bat
   ```

### On Linux/Mac:

1. Open a Terminal
2. Navigate to the project directory
3. Make the script executable:
   ```
   chmod +x run_fix.sh
   ```
4. Run the script:
   ```
   ./run_fix.sh
   ```

### Manual Fix:

If the scripts don't work, you can run the MongoDB script directly:

```
mongosh --file fix_document_uploader.js
```

## Solution 3: Use the App's Built-in Fix

The mobile app now has a built-in fix that runs when the app starts. It will:

1. Check for documents with inconsistent user information
2. Update them with the correct information
3. Show a success message when documents are updated

## Verification

After applying any of these fixes:

1. Restart the web application
2. Go to the Documents page
3. Verify that documents show "John Matthew Banto" as the uploader instead of "Javier Velasco"
4. Check that the service number shows "2019-10180" and the company shows "Alpha"

## Prevention

The app has been updated to ensure this issue doesn't happen again by:

1. Ensuring the `userId` always matches the `uploadedBy._id` field
2. Using the correct user information from the logged-in user
3. Performing consistency checks when uploading documents 