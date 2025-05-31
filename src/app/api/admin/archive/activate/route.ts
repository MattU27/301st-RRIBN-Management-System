import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import { UserStatus } from '@/types/auth';
import mongoose from 'mongoose';

/**
 * POST handler to directly activate a user from the archive
 * This is a direct method that bypasses other logic and just makes the DB update
 */
export async function POST(request: Request) {
  try {
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
    
    // Only directors can update user status
    if (decoded.role !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only directors can activate archived accounts.' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    let { userId } = body;
    
    console.log('Direct activation request received for user:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    try {
      // Ensure userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Invalid ObjectId: ${userId}`);
        return NextResponse.json(
          { success: false, error: 'Invalid user ID format' },
          { status: 400 }
        );
      }
      
      // Convert string ID to ObjectId
      const objectId = new mongoose.Types.ObjectId(userId);
      
      // First, get current user state for debugging
      const existingUser = await User.findById(objectId).lean();
      if (!existingUser) {
        console.error(`User not found with ID: ${userId}`);
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.log('Before update - Current user state:', {
        id: existingUser._id,
        name: `${existingUser.firstName} ${existingUser.lastName}`,
        status: existingUser.status,
        isArchived: existingUser.isArchived
      });
      
      // DIRECT DB OPERATION: Use updateOne with MongoDB driver for most direct access
      const collection = mongoose.connection.collection('users');
      const result = await collection.updateOne(
        { _id: objectId },
        { 
          $set: { 
            status: 'active',
            isArchived: false,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('Raw MongoDB update result:', result);
      
      if (result.modifiedCount === 0) {
        console.error('MongoDB update operation did not modify any document');
        return NextResponse.json(
          { success: false, error: 'Failed to update user - no documents modified' },
          { status: 500 }
        );
      }
      
      // Get the updated user to verify changes
      const updatedUser = await User.findById(objectId).lean();
      console.log('After update - Updated user state:', {
        id: updatedUser._id,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        status: updatedUser.status,
        isArchived: updatedUser.isArchived
      });
      
      // Double-check isArchived flag
      if (updatedUser.isArchived === true) {
        console.error('isArchived flag still true after update, attempting second update');
        
        // Try one more time with forced update
        const secondResult = await collection.updateOne(
          { _id: objectId },
          { 
            $set: { 
              isArchived: false 
            } 
          },
          { bypassDocumentValidation: true }
        );
        
        console.log('Second update result:', secondResult);
        
        // Final verification
        const finalUser = await User.findById(objectId).lean();
        console.log('Final user state after second update:', {
          id: finalUser._id,
          name: `${finalUser.firstName} ${finalUser.lastName}`,
          status: finalUser.status,
          isArchived: finalUser.isArchived 
        });
      }
      
      return NextResponse.json({
        success: true,
        data: { 
          message: 'User activated successfully',
          userId: userId,
          isArchived: updatedUser.isArchived,
          status: updatedUser.status
        }
      });
      
    } catch (err) {
      console.error('Error during user activation:', err);
      return NextResponse.json({
        success: false,
        error: `Error during activation: ${err.message || 'Unknown error'}`
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Unexpected error during activation process:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 