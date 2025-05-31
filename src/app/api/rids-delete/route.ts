import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import RIDS from '@/models/RIDS';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import fs from 'fs';
import path from 'path';

/**
 * POST handler to remove a RIDS entry and its associated user
 * Uses POST method for better compatibility
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
    
    // Parse the request body
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'RIDS ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to delete RIDS with ID: ${id}`);
    
    // Find and delete the RIDS entry
    const ridsEntry = await RIDS.findById(id);
    
    if (!ridsEntry) {
      return NextResponse.json(
        { success: false, error: 'RIDS not found' },
        { status: 404 }
      );
    }
    
    // If there are uploaded documents, delete them
    if (ridsEntry.documents && ridsEntry.documents.length > 0) {
      ridsEntry.documents.forEach((doc: any) => {
        if (doc.filePath) {
          const filePath = path.join(process.cwd(), 'public', doc.filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          }
        }
      });
    }
    
    // Delete the RIDS entry
    await RIDS.findByIdAndDelete(id);
    console.log(`RIDS entry deleted: ${id}`);
    
    // Find the associated user if needed
    if (ridsEntry.userId) {
      const user = await User.findById(ridsEntry.userId);
      if (user) {
        // You can either delete the user or just update their status
        // Option 1: Delete the user
        // await User.findByIdAndDelete(ridsEntry.userId);
        
        // Option 2: Update the user's status (safer option)
        await User.findByIdAndUpdate(ridsEntry.userId, {
          $set: {
            isRegistrationComplete: false,
            ridsStatus: 'not_submitted'
          }
        });
        console.log(`Updated user status: ${ridsEntry.userId}`);
      }
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'RIDS deleted successfully'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error deleting RIDS:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete RIDS'
      },
      { status: 500 }
    );
  }
} 