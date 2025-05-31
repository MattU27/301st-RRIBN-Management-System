import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import RIDS from '@/models/RIDS';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import { hasPermission } from '@/utils/rolePermissions';
import fs from 'fs';
import path from 'path';

/**
 * DELETE handler to remove a RIDS entry and optionally its associated user
 * Uses query parameter ?id= instead of path parameter
 */
export async function DELETE(request: Request) {
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
    
    // Only staff, admin, and director roles can delete RIDS
    if (!(['staff', 'admin', 'director', 'administrator'].includes(decoded.role))) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get the ID from the query parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('Deleting RIDS with ID:', id);
    
    // Find the RIDS document
    const ridsDoc = await RIDS.findOne({ userId: id });
    
    if (!ridsDoc) {
      return NextResponse.json(
        { success: false, error: 'RIDS document not found' },
        { status: 404 }
      );
    }
    
    // Check if there's an associated file and delete it
    if (ridsDoc.filePath) {
      const rootDir = process.cwd();
      const filePath = path.join(rootDir, 'public', ridsDoc.filePath);
      
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Deleted file:', filePath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with deletion even if file deletion fails
      }
    }
    
    // Delete the RIDS document
    await RIDS.deleteOne({ userId: id });
    console.log('Deleted RIDS document');
    
    // Delete the user (optional - could make this configurable)
    const user = await User.findById(id);
    if (user) {
      await User.deleteOne({ _id: id });
      console.log('Deleted associated user');
    }
    
    return NextResponse.json({
      success: true,
      message: 'RIDS and associated user deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting RIDS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error deleting RIDS' },
      { status: 500 }
    );
  }
} 