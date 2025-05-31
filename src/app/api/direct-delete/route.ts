import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';

/**
 * POST handler for direct database deletion with comprehensive error reporting
 */
export async function POST(request: Request) {
  try {
    console.log('Starting direct-delete operation');
    
    // Parse the request body
    const body = await request.json();
    const { id, collection } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to delete document with ID: ${id} from collection: ${collection}`);
    
    // Connect to MongoDB directly
    await dbConnect();
    
    // Check connection status
    const connectionStatus = mongoose.connection.readyState;
    console.log(`MongoDB connection status: ${connectionStatus}`);
    
    if (connectionStatus !== 1) {
      return NextResponse.json(
        { success: false, error: 'Database connection not established', connectionStatus },
        { status: 500 }
      );
    }
    
    // Get the database directly
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection not established - db is undefined' },
        { status: 500 }
      );
    }
    
    // Check if collection exists
    const collections = await db.listCollections({ name: collection }).toArray();
    if (collections.length === 0) {
      return NextResponse.json(
        { success: false, error: `Collection '${collection}' does not exist` },
        { status: 404 }
      );
    }
    
    // Special case for RIDS collection: Get the document first to find associated user
    let userId = null;
    if (collection === 'rids') {
      try {
        const ridsDoc = await db.collection('rids').findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (ridsDoc) {
          userId = ridsDoc.userId;
          console.log(`Found associated user ID: ${userId} for RIDS ID: ${id}`);
        }
      } catch (err) {
        console.log(`Error getting RIDS document before deletion: ${err}`);
      }
    }
    
    // Perform deletion using direct MongoDB driver commands
    // This bypasses Mongoose models for maximum reliability
    const result = await db.collection(collection).deleteOne({ _id: new mongoose.Types.ObjectId(id) });
    
    console.log('Deletion result:', result);
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found or already deleted', result },
        { status: 404 }
      );
    }
    
    // If this was a RIDS document and we have the userId, reset the user's registration status
    if (collection === 'rids' && userId) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: {
            isRegistrationComplete: false,
            ridsStatus: 'not_submitted'
          }
        });
        console.log(`Reset registration status for user: ${userId}`);
      } catch (err) {
        console.log(`Error updating user after RIDS deletion: ${err}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      result,
      userUpdated: userId ? true : false
    });
    
  } catch (error: any) {
    console.error('Error in direct-delete operation:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error during deletion',
        stack: error.stack,
        name: error.name
      },
      { status: 500 }
    );
  }
} 