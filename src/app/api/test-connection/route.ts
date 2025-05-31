import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';

// GET /api/test-connection - Test database connection
export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Check connection status
    const isConnected = mongoose.connection.readyState === 1;
    
    // Get database statistics if connected
    let dbStats = null;
    let collections: string[] = [];
    
    if (isConnected && mongoose.connection.db) {
      try {
        dbStats = await mongoose.connection.db.stats();
        const collectionList = await mongoose.connection.db.listCollections().toArray();
        collections = collectionList.map(col => col.name);
      } catch (error) {
        console.error('Error getting database stats:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      database: {
        connected: isConnected,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        stats: dbStats,
        collections
      }
    });
  } catch (error: any) {
    console.error('Error testing database connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error testing database connection: ' + error.message,
        mongodbUri: process.env.MONGODB_URI ? 'Configured' : 'Missing',
        mongooseVersion: mongoose.version
      },
      { status: 500 }
    );
  }
} 