import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * Direct database cleanup API for removing problematic records
 * This can be run on application startup to ensure clean state
 */
export async function GET(request: Request) {
  try {
    console.log('Running direct database cleanup operation');
    
    // Connect to MongoDB
    await dbConnect();
    
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { success: false, error: 'Database connection not established' },
        { status: 500 }
      );
    }
    
    const db = mongoose.connection.db;
    const results = {
      collections: [] as Array<{
        name: string;
        deletedCount: number;
      }>
    };
    
    // Target problematic service IDs
    const problematicIds = ['CD-2019-1016780'];
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    // Loop through each collection and delete problematic records
    for (const collection of collections) {
      try {
        const collectionObj = db.collection(collection.name);
        let totalDeleted = 0;
        
        for (const problematicId of problematicIds) {
          // Try common field patterns
          const deletePatterns = [
            { "serviceId": problematicId },
            { "identificationInfo.serviceId": problematicId },
            { "service_id": problematicId },
            { "serviceNumber": problematicId }
          ];
          
          for (const pattern of deletePatterns) {
            try {
              const deleteResult = await collectionObj.deleteMany(pattern);
              totalDeleted += deleteResult.deletedCount;
            } catch (deleteError) {
              // Ignore errors in specific delete operations
            }
          }
          
          // Also try regex match for partial matches
          try {
            const regexPattern = { 
              $or: [
                { "serviceId": { $regex: problematicId, $options: 'i' } },
                { "identificationInfo.serviceId": { $regex: problematicId, $options: 'i' } }
              ]
            };
            
            const regexResult = await collectionObj.deleteMany(regexPattern);
            totalDeleted += regexResult.deletedCount;
          } catch (regexError) {
            // Ignore regex errors
          }
        }
        
        if (totalDeleted > 0) {
          results.collections.push({
            name: collection.name,
            deletedCount: totalDeleted
          });
          
          console.log(`Cleaned ${totalDeleted} problematic records from ${collection.name}`);
        }
      } catch (collectionError) {
        console.log(`Error processing collection ${collection.name}:`, collectionError);
      }
    }
    
    // Log the cleanup to a file
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const logFilePath = path.join(process.cwd(), 'logs', `db-cleanup-${timestamp}.json`);
      
      const logData = {
        timestamp: new Date().toISOString(),
        results
      };
      
      fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    } catch (logError) {
      console.error('Error writing cleanup log:', logError);
    }
    
    // Add no-cache headers
    const response = NextResponse.json({
      success: true,
      message: 'Database cleanup completed',
      results
    });
    
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    console.error('Error in database cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error during database cleanup'
      },
      { status: 500 }
    );
  }
} 