import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * Enhanced POST handler for a forceful cleanup of RIDS records
 * This is a comprehensive solution that works for any Service ID
 */
export async function POST(request: Request) {
  try {
    console.log('Starting Enhanced FORCE cleanup operation');
    
    // Connect to MongoDB
    await dbConnect();
    
    // Parse the request body
    const body = await request.json();
    const { serviceId } = body;
    
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Force-cleaning records with Service ID: ${serviceId}`);
    
    // Special handling for the problematic CD-2019-1016780 service ID
    const isProblematicServiceId = serviceId === 'CD-2019-1016780';
    
    if (isProblematicServiceId) {
      console.log('⚠️ Detected problematic service ID: CD-2019-1016780 - applying special cleanup');
    }
    
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { success: false, error: 'Database connection not established' },
        { status: 500 }
      );
    }
    
    const db = mongoose.connection.db;
    
    // COMPREHENSIVE MULTIPLE-STEP CLEANUP APPROACH
    const results: {
      usersFound: number;
      usersUpdated: number;
      ridsDeleted: number;
      documentsDeleted: number;
      pendingUsersDeleted: number;
      operations: Array<{
        operation: string;
        count?: number;
        userIds?: string[];
        error?: string;
      }>;
    } = {
      usersFound: 0,
      usersUpdated: 0,
      ridsDeleted: 0,
      documentsDeleted: 0,
      pendingUsersDeleted: 0,
      operations: []
    };
    
    // Step 1: Find ALL users with this service ID (by multiple fields)
    try {
      const usersCollection = db.collection('users');
      
      // Enhanced query to find users by multiple fields that might contain serviceId
      const users = await usersCollection.find({
        $or: [
          { serviceId: serviceId },
          { "ridsData.identificationInfo.serviceId": serviceId },
          { serviceNumber: serviceId },
          { militaryId: serviceId }
        ]
      }).toArray();
      
      results.usersFound = users.length;
      
      console.log(`Found ${users.length} users with service ID ${serviceId}`);
      
      let userIds = [];
      
      for (const user of users) {
        userIds.push(user._id);
        
        // Special handling for "Pending Registration" users
        const isPendingRegistration = user.fullName === 'Pending Registration' || 
                                     (user.firstName === 'Pending' && user.lastName === 'Registration');
        
        // For pending registration, DELETE instead of update
        if (isPendingRegistration) {
          const deleteResult = await usersCollection.deleteOne({ _id: user._id });
          if (deleteResult.deletedCount > 0) {
            results.pendingUsersDeleted++;
            console.log(`Deleted pending registration user: ${user._id}`);
          }
        } else {
          // More thorough update to fix reappearing issue:
          // Reset ALL fields that could cause the record to be recreated
          const updateResult = await usersCollection.updateOne(
            { _id: user._id },
            {
              $set: {
                isRegistrationComplete: false,
                isVerified: false,
                ridsStatus: 'not_submitted',
                status: 'pending',
                canRegister: false, // Prevent this service ID from registering again
              },
              $unset: {
                ridsData: "",
                ridsId: "",
                documentId: "",
                rids: "",           // Remove any references to RIDS
                "ridsData.identificationInfo": "", // Clear identificationInfo specifically
                documents: "",      // Clear document references
                documentIds: ""     // Clear document ID arrays
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            results.usersUpdated++;
          }
        }
      }
      
      results.operations.push({
        operation: 'users_update',
        count: results.usersUpdated,
        userIds: userIds.map(id => id.toString())
      });
      
      if (results.pendingUsersDeleted > 0) {
        results.operations.push({
          operation: 'pending_users_deleted',
          count: results.pendingUsersDeleted
        });
      }
    } catch (error: any) {
      console.error('Error updating users:', error);
      results.operations.push({
        operation: 'users_update_error',
        error: error.message
      });
    }
    
    // Step 2: Delete from RIDS collection using multiple strategies
    try {
      const ridsCollection = db.collection('rids');
      
      // FIRST APPROACH: Delete by serviceId in identificationInfo
      const byServiceIdResult = await ridsCollection.deleteMany({
        "identificationInfo.serviceId": serviceId
      });
      
      results.ridsDeleted += byServiceIdResult.deletedCount;
      
      results.operations.push({
        operation: 'delete_by_service_id',
        count: byServiceIdResult.deletedCount
      });
      
      // SECOND APPROACH: Try alternate fields that might contain service ID
      const byAlternateFieldsResult = await ridsCollection.deleteMany({
        $or: [
          { "serviceId": serviceId },
          { "service_id": serviceId },
          { "serviceNumber": serviceId },
          { "identificationInfo.serviceNumber": serviceId }
        ]
      });
      
      results.ridsDeleted += byAlternateFieldsResult.deletedCount;
      
      results.operations.push({
        operation: 'delete_by_alternate_fields',
        count: byAlternateFieldsResult.deletedCount
      });
      
      // THIRD APPROACH: Delete RIDS with Pending Registration status for this service ID
      const pendingRidsResult = await ridsCollection.deleteMany({
        $and: [
          { "identificationInfo.serviceId": serviceId },
          { "personalInformation.fullName": "Pending Registration" }
        ]
      });
      
      results.ridsDeleted += pendingRidsResult.deletedCount;
      
      results.operations.push({
        operation: 'delete_pending_rids',
        count: pendingRidsResult.deletedCount
      });
      
      // Special handling for problematic service ID
      if (isProblematicServiceId) {
        // Try a more aggressive approach for this specific case
        const aggressiveResult = await ridsCollection.deleteMany({
          $or: [
            { "identificationInfo.serviceId": { $regex: serviceId, $options: 'i' } },
            { "personalInformation.fullName": "Pending Registration" },
            { "userId": { $in: results.operations.find(op => op.operation === 'users_update')?.userIds || [] } }
          ]
        });
        
        results.ridsDeleted += aggressiveResult.deletedCount;
        
        results.operations.push({
          operation: 'aggressive_delete_for_problematic_id',
          count: aggressiveResult.deletedCount
        });
      }
      
      // FOURTH APPROACH: Text search for the service ID in any field
      try {
        const textResult = await ridsCollection.deleteMany({
          $text: { $search: serviceId }
        });
        
        results.ridsDeleted += textResult.deletedCount;
        
        results.operations.push({
          operation: 'delete_by_text_search',
          count: textResult.deletedCount
        });
      } catch (textError: any) {
        // Text search might fail if text index is not set up
        console.log('Text search failed, continuing with other approaches:', textError.message);
      }
    } catch (error: any) {
      console.error('Error deleting RIDS documents:', error);
      results.operations.push({
        operation: 'rids_delete_error',
        error: error.message
      });
    }
    
    // Step 3: Also check for documents in other collections
    try {
      // Clean up from documents collection if it exists
      const documentsCollection = db.collection('documents');
      if (documentsCollection) {
        const docResult = await documentsCollection.deleteMany({
          $or: [
            { "serviceId": serviceId },
            { "ownerId": serviceId },
            { "metadata.serviceId": serviceId }
          ]
        });
        
        results.documentsDeleted = docResult.deletedCount;
        
        results.operations.push({
          operation: 'documents_delete',
          count: docResult.deletedCount
        });
      }
    } catch (error: any) {
      console.error('Error checking other collections:', error);
      results.operations.push({
        operation: 'documents_delete_error',
        error: error.message
      });
    }
    
    // Step 4: SPECIAL CASE - Find any RIDS document that refers to this service ID as a string in any field
    try {
      const ridsCollection = db.collection('rids');
      const fieldsToCheck = ['serviceId', 'userId', 'identificationInfo'];
      
      for (const field of fieldsToCheck) {
        // Create a dynamic query to check if the field contains the service ID as a string
        const query: Record<string, any> = {};
        query[field] = { $regex: serviceId, $options: 'i' };
        
        const matchResult = await ridsCollection.deleteMany(query);
        
        if (matchResult.deletedCount > 0) {
          results.ridsDeleted += matchResult.deletedCount;
          results.operations.push({
            operation: `delete_by_regex_${field}`,
            count: matchResult.deletedCount
          });
        }
      }
    } catch (regexError: any) {
      console.error('Error with regex search:', regexError);
      // Add to operations for complete error tracking
      results.operations.push({
        operation: 'regex_search_error',
        error: regexError.message || 'Unknown regex error'
      });
    }
    
    // NEW STEP: Look for any cached entries in user collection with embedded RIDS data
    try {
      const usersCollection = db.collection('users');
      
      // Find users who have embedded RIDS data with this service ID
      const usersWithEmbeddedRids = await usersCollection.find({
        "ridsData.identificationInfo.serviceId": serviceId
      }).toArray();
      
      console.log(`Found ${usersWithEmbeddedRids.length} users with embedded RIDS data`);
      
      if (usersWithEmbeddedRids.length > 0) {
        // Update all these users to remove the embedded RIDS data
        const updateResult = await usersCollection.updateMany(
          { "ridsData.identificationInfo.serviceId": serviceId },
          { 
            $unset: { 
              ridsData: "",
              ridsStatus: "",
              documentId: "",
              documentIds: ""
            },
            $set: {
              isVerified: false,
              status: "pending"
            }
          }
        );
        
        results.operations.push({
          operation: 'clear_embedded_rids_data',
          count: updateResult.modifiedCount
        });
      }
    } catch (embeddedError: any) {
      console.error('Error clearing embedded RIDS data:', embeddedError);
      results.operations.push({
        operation: 'clear_embedded_rids_error',
        error: embeddedError.message
      });
    }
    
    // Save cleanup logs to file for auditing
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const logFileName = `cleanup-${serviceId}-${timestamp}.json`;
      const logFilePath = path.join(process.cwd(), 'logs', logFileName);
      
      const logData = {
        timestamp: new Date().toISOString(),
        serviceId,
        results
      };
      
      fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
      console.log(`Cleanup log saved to ${logFilePath}`);
    } catch (logError: any) {
      console.error('Error saving cleanup log:', logError);
    }
    
    // Step 5: Return detailed results
    return NextResponse.json({
      success: true,
      message: `Force cleanup completed with ${results.usersUpdated} users updated, ${results.pendingUsersDeleted} pending users deleted, and ${results.ridsDeleted} RIDS documents deleted`,
      serviceId: serviceId,
      results: results
    });
    
  } catch (error: any) {
    console.error('Error in force cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error during force cleanup'
      },
      { status: 500 }
    );
  }
} 