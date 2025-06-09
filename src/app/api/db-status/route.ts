import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/utils/dbConnect';

/**
 * GET handler to check database connection status
 */
export async function GET() {
  try {
    // Try to connect to the database
    await dbConnect();
    
    // Check connection status
    const isConnected = mongoose.connection.readyState === 1;
    
    // Get database name if connected
    let dbName: string | null = null;
    let collections: string[] = [];
    
    if (isConnected && mongoose.connection.db) {
      dbName = mongoose.connection.db.databaseName;
      
      // Get collections if connected
      const collectionInfo = await mongoose.connection.db.listCollections().toArray();
      collections = collectionInfo.map(col => col.name);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        isConnected,
        connectionState: mongoose.connection.readyState,
        dbName,
        collections,
        connectionString: process.env.NODE_ENV === 'development' ? 
          process.env.MONGODB_URI : 'Connection string hidden in production'
      }
    });
  } catch (error: any) {
    console.error('Error checking database status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error checking database status',
        connectionState: mongoose.connection.readyState
      },
      { status: 500 }
    );
  }
} 