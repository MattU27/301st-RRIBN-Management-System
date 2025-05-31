import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import RIDS from '@/models/RIDS';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * POST handler to completely purge a reservist's RIDS data
 * This is a comprehensive solution that ensures all data is cleaned up
 */
export async function POST(request: Request) {
  try {
    console.log('Starting comprehensive RIDS purge operation');
    
    // Connect to MongoDB
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { userId, ridsId } = body;
    
    if (!userId && !ridsId) {
      return NextResponse.json(
        { success: false, error: 'Either userId or ridsId is required' },
        { status: 400 }
      );
    }
    
    console.log(`Purging RIDS data for ${userId ? 'User ID: ' + userId : 'RIDS ID: ' + ridsId}`);
    
    // Find the RIDS document
    let ridsDocument;
    if (ridsId) {
      ridsDocument = await RIDS.findById(ridsId).lean();
    } else if (userId) {
      ridsDocument = await RIDS.findOne({ userId }).lean();
    }
    
    // If no RIDS document found but we have a userId, still update the user record
    if (!ridsDocument && userId) {
      console.log(`No RIDS document found for User ID: ${userId}, updating user record only`);
      
      const updateResult = await User.findByIdAndUpdate(userId, {
        $set: {
          isRegistrationComplete: false,
          ridsStatus: 'not_submitted'
        }
      });
      
      if (!updateResult) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'User record updated, no RIDS document found to delete',
        userUpdated: true,
        ridsDeleted: false
      });
    }
    
    // If RIDS document found, process deletion
    if (ridsDocument) {
      // Get the associated userId if we didn't have it yet
      const associatedUserId = userId || (ridsDocument as any).userId;
      
      // Delete any attached files
      if ((ridsDocument as any).filePath) {
        try {
          const filePath = path.join(process.cwd(), 'public', (ridsDocument as any).filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          }
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }
      
      // Delete the RIDS document
      let deleteResult;
      if (ridsId) {
        deleteResult = await RIDS.findByIdAndDelete(ridsId);
      } else {
        deleteResult = await RIDS.findOneAndDelete({ userId });
      }
      
      console.log(`RIDS document deleted:`, deleteResult ? 'success' : 'failed');
      
      // Update the user record
      if (associatedUserId) {
        // First, try using Mongoose
        let userUpdateResult = await User.findByIdAndUpdate(associatedUserId, {
          $set: {
            isRegistrationComplete: false,
            ridsStatus: 'not_submitted'
          }
        });
        
        // If that fails, try direct MongoDB update
        if (!userUpdateResult && mongoose.connection.db) {
          const directResult = await mongoose.connection.db.collection('users').updateOne(
            { _id: new mongoose.Types.ObjectId(associatedUserId) },
            {
              $set: {
                isRegistrationComplete: false,
                ridsStatus: 'not_submitted'
              }
            }
          );
          console.log('Direct MongoDB update result:', directResult);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'RIDS data completely purged',
        userId: associatedUserId,
        userUpdated: !!associatedUserId,
        ridsDeleted: true
      });
    }
    
    // If we get here, no RIDS document was found
    return NextResponse.json(
      { success: false, error: 'RIDS data not found' },
      { status: 404 }
    );
    
  } catch (error: any) {
    console.error('Error purging RIDS data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error purging RIDS data',
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 