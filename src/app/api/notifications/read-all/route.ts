import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyJWT } from '@/utils/auth';
import { auditService } from '@/utils/auditService';
import { dbConnect } from '@/utils/dbConnect';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * PUT handler for marking all notifications as read
 */
export async function PUT(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Get the DB from mongoose
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Update all notifications to mark as read
    const result = await db.collection('notifications').updateMany(
      { userId: decoded.userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    
    // Log activity
    auditService.logUserAction(
      decoded.userId,
      decoded.userId,
      decoded.role,
      'update',
      'system',
      undefined,
      'User marked all notifications as read'
    );
    
    // Return response
    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error(`Notifications API Error: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 