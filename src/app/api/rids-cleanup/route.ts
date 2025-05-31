import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import mongoose from 'mongoose';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';

/**
 * POST handler to completely refresh reservist data state
 */
export async function POST(request: Request) {
  try {
    console.log('Starting RIDS cleanup operation');
    
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
    
    if (!decoded || !['admin', 'director', 'administrator'].includes(decoded.role)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get database connection
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection not established' },
        { status: 500 }
      );
    }
    
    // 1. Check if 'rids' collection exists
    const collections = await db.listCollections({ name: 'rids' }).toArray();
    
    // 2. Delete all documents from rids collection if it exists
    if (collections.length > 0) {
      await db.collection('rids').deleteMany({});
      console.log('All RIDS documents deleted');
    }
    
    // 3. Reset all users' registration status
    const usersUpdated = await User.updateMany(
      { role: 'reservist' },
      { 
        $set: { 
          isRegistrationComplete: false,
          ridsStatus: 'not_submitted'
        } 
      }
    );
    
    console.log(`Updated ${usersUpdated.modifiedCount} users`);
    
    return NextResponse.json({
      success: true,
      message: 'RIDS data fully cleaned up',
      ridsCollection: collections.length > 0 ? 'reset' : 'not_found',
      usersUpdated: usersUpdated.modifiedCount
    });
    
  } catch (error: any) {
    console.error('Error during RIDS cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error during cleanup'
      },
      { status: 500 }
    );
  }
} 