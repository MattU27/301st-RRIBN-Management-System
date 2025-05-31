import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * Emergency cleanup route to aggressively remove problematic service IDs
 * This is used as a last resort for fixing persistent data issues
 */
export async function GET(request: Request) {
  try {
    console.log('Starting EMERGENCY cleanup operation');
    
    // Connect to MongoDB
    await dbConnect();
    
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { success: false, error: 'Database connection not established' },
        { status: 500 }
      );
    }
    
    const db = mongoose.connection.db;
    const problematicServiceId = 'CD-2019-1016780';
    
    // Track results for debugging
    const results = {
      usersCleaned: 0,
      ridsCleaned: 0,
      documentsCleaned: 0,
      errors: [] as string[]
    };
    
    // STEP 1: Aggressive user collection cleanup
    try {
      const usersCollection = db.collection('users');
      
      // Delete any user with this service ID
      const userDeleteResult = await usersCollection.deleteMany({ 
        serviceId: problematicServiceId 
      });
      
      results.usersCleaned += userDeleteResult.deletedCount;
      console.log(`Deleted ${userDeleteResult.deletedCount} users with service ID ${problematicServiceId}`);
      
      // Update any users that have RIDS data with this service ID
      const userUpdateResult = await usersCollection.updateMany(
        { 'ridsData.identificationInfo.serviceId': problematicServiceId },
        {
          $unset: {
            ridsData: "",
            ridsId: "",
            documentId: ""
          },
          $set: {
            isRegistrationComplete: false,
            ridsStatus: 'not_submitted'
          }
        }
      );
      
      console.log(`Updated ${userUpdateResult.modifiedCount} users with RIDS data containing service ID ${problematicServiceId}`);
    } catch (error: any) {
      console.error('Error cleaning user collection:', error);
      results.errors.push(`User cleanup error: ${error.message}`);
    }
    
    // STEP 2: RIDS collection cleanup with multiple approaches
    try {
      const ridsCollection = db.collection('rids');
      
      // Use multiple query patterns to catch all possible variations
      const cleanupOperations = [
        { "identificationInfo.serviceId": problematicServiceId },
        { "serviceId": problematicServiceId },
        { "personalInformation.fullName": "Pending Registration" },
        { "serviceNumber": problematicServiceId }
      ];
      
      for (const query of cleanupOperations) {
        const deleteResult = await ridsCollection.deleteMany(query);
        results.ridsCleaned += deleteResult.deletedCount;
        console.log(`Deleted ${deleteResult.deletedCount} RIDS documents with query:`, query);
      }
      
      // Try text search as a fallback
      try {
        const textResult = await ridsCollection.deleteMany({
          $text: { $search: problematicServiceId }
        });
        results.ridsCleaned += textResult.deletedCount;
        console.log(`Text search deleted ${textResult.deletedCount} RIDS documents`);
      } catch (textError) {
        // Text search might fail if no text index is set up
        console.log('Text search failed, continuing with other approaches');
      }
      
      // Try regex search on all string fields
      const regexQuery = { 
        $or: [
          { "identificationInfo.serviceId": { $regex: problematicServiceId, $options: 'i' } },
          { "serviceId": { $regex: problematicServiceId, $options: 'i' } },
          { "serviceNumber": { $regex: problematicServiceId, $options: 'i' } }
        ]
      };
      
      const regexResult = await ridsCollection.deleteMany(regexQuery);
      results.ridsCleaned += regexResult.deletedCount;
      console.log(`Regex search deleted ${regexResult.deletedCount} RIDS documents`);
    } catch (error: any) {
      console.error('Error cleaning RIDS collection:', error);
      results.errors.push(`RIDS cleanup error: ${error.message}`);
    }
    
    // STEP 3: Clean up related documents collection
    try {
      if (db.collection('documents')) {
        const documentsResult = await db.collection('documents').deleteMany({
          $or: [
            { "serviceId": problematicServiceId },
            { "metadata.serviceId": problematicServiceId }
          ]
        });
        
        results.documentsCleaned += documentsResult.deletedCount;
        console.log(`Deleted ${documentsResult.deletedCount} document records`);
      }
    } catch (error: any) {
      console.error('Error cleaning documents collection:', error);
      results.errors.push(`Documents cleanup error: ${error.message}`);
    }
    
    // STEP 4: Final direct database scan for any related data
    try {
      // Get all collection names
      const collections = await db.listCollections().toArray();
      
      for (const collection of collections) {
        // Skip already handled collections
        if (['users', 'rids', 'documents'].includes(collection.name)) continue;
        
        try {
          // Try a general search in this collection
          const collectionObj = db.collection(collection.name);
          const searchPattern = { $regex: problematicServiceId, $options: 'i' };
          
          // Search on common field names
          const query = {
            $or: [
              { "serviceId": searchPattern },
              { "service_id": searchPattern },
              { "serviceNumber": searchPattern }
            ]
          };
          
          const deleteResult = await collectionObj.deleteMany(query);
          if (deleteResult.deletedCount > 0) {
            console.log(`Deleted ${deleteResult.deletedCount} matching records from ${collection.name}`);
          }
        } catch (collError) {
          // Skip errors on individual collections
          console.log(`Skipping error in collection ${collection.name}`);
        }
      }
    } catch (error: any) {
      console.error('Error in full database scan:', error);
      results.errors.push(`Database scan error: ${error.message}`);
    }
    
    // Log the cleanup operation
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const logFilePath = path.join(process.cwd(), 'logs', `emergency-cleanup-${timestamp}.json`);
      
      const logData = {
        timestamp: new Date().toISOString(),
        serviceId: problematicServiceId,
        results
      };
      
      fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
      console.log(`Emergency cleanup log saved to ${logFilePath}`);
    } catch (logError: any) {
      console.error('Error saving cleanup log:', logError);
    }
    
    // Add cache prevention headers
    const response = NextResponse.json({
      success: true,
      message: `Emergency cleanup completed for service ID ${problematicServiceId}`,
      results
    });
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    console.error('Error in emergency cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error during emergency cleanup'
      },
      { status: 500 }
    );
  }
} 