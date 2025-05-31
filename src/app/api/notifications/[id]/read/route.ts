import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyJWT } from '@/utils/auth';
import { auditService } from '@/utils/auditService';
import { dbConnect } from '@/utils/dbConnect';
import { ObjectId } from 'mongodb';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * PUT handler for marking a notification as read
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      );
    }
    
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
    
    // Find the notification first to verify ownership
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(id),
      userId: decoded.userId
    });
    
    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found or not authorized to access' },
        { status: 404 }
      );
    }
    
    // Update the notification to mark as read
    await db.collection('notifications').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true, readAt: new Date() } }
    );
    
    // Log activity
    auditService.logUserAction(
      decoded.userId,
      decoded.userId,
      decoded.role,
      'update',
      'system',
      id,
      'User marked notification as read'
    );
    
    // Return response
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    console.error(`Notifications API Error: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 