import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import RIDS from '@/models/RIDS';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

/**
 * POST handler to purge RIDS data - simpler implementation
 */
export async function POST(request: Request) {
  try {
    console.log('Starting simplified RIDS purge operation');
    
    // Connect to MongoDB
    await dbConnect();
    
    // Parse the request body
    const body = await request.json();
    const { ridsId } = body;
    
    if (!ridsId) {
      return NextResponse.json(
        { success: false, error: 'RIDS ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to purge RIDS with ID: ${ridsId}`);
    
    // Step 1: Find the RIDS document to get the userId
    let userId = null;
    try {
      const ridsDoc = await RIDS.findById(ridsId).lean();
      if (ridsDoc) {
        // @ts-ignore - Handle TypeScript error with MongoDB document
        userId = ridsDoc.userId;
        console.log(`Found associated user ID: ${userId}`);
      }
    } catch (err) {
      console.error('Error finding RIDS document:', err);
    }
    
    // Step 2: Delete the RIDS document
    try {
      const deleteResult = await RIDS.findByIdAndDelete(ridsId);
      console.log('RIDS deletion result:', deleteResult ? 'success' : 'not found');
      
      if (!deleteResult) {
        // If we can't find the document through Mongoose, try direct MongoDB
        if (mongoose.connection.db) {
          const directResult = await mongoose.connection.db.collection('rids').deleteOne({
            _id: new mongoose.Types.ObjectId(ridsId)
          });
          console.log('Direct MongoDB deletion result:', directResult);
        }
      }
    } catch (err) {
      console.error('Error deleting RIDS document:', err);
    }
    
    // Step 3: Update the user record if we found a userId
    if (userId) {
      try {
        const userUpdateResult = await User.findByIdAndUpdate(userId, {
          $set: {
            isRegistrationComplete: false,
            ridsStatus: 'not_submitted'
          }
        });
        console.log('User update result:', userUpdateResult ? 'success' : 'user not found');
      } catch (err) {
        console.error('Error updating user:', err);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'RIDS purge operation completed',
      userUpdated: !!userId
    });
    
  } catch (error: any) {
    console.error('Error in RIDS purge operation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error purging RIDS' },
      { status: 500 }
    );
  }
} 