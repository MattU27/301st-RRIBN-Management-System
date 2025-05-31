import { NextResponse } from 'next/server';
import { dbConnect, isUsingLocalFallback } from '@/utils/dbConnect';
import RIDS from '@/models/RIDS';
import mongoose from 'mongoose';

/**
 * GET handler to debug database connection and list all RIDS documents
 */
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    const db = await dbConnect();
    
    // Get database status
    const dbStatus = {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      usingLocalFallback: isUsingLocalFallback(),
      database: mongoose.connection.db?.databaseName || 'Not connected',
      models: Object.keys(mongoose.models)
    };
    
    // Get list of all RIDS documents
    let ridsDocuments = [];
    try {
      ridsDocuments = await RIDS.find({}).lean();
    } catch (error: any) {
      console.error('Error fetching RIDS documents:', error);
    }
    
    return NextResponse.json({
      success: true,
      dbStatus,
      ridsCount: ridsDocuments.length,
      ridsIds: ridsDocuments.map((doc: any) => ({
        id: doc._id,
        userId: doc.userId
      }))
    });
  } catch (error: any) {
    console.error('Database debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Database debug error',
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 