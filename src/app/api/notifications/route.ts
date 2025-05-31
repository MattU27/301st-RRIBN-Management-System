import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyJWT } from '@/utils/auth';
import { auditService } from '@/utils/auditService';
import { dbConnect } from '@/utils/dbConnect';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching user notifications
 */
export async function GET(req: NextRequest) {
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
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const isRead = searchParams.get('isRead');
    
    // Build query filters
    const filter: any = {
      userId: decoded.userId
    };
    
    // Add isRead filter if specified
    if (isRead !== null) {
      filter.isRead = isRead === 'true';
    }
    
    // Get the DB from mongoose
    const db = mongoose.connection.db;
    
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Query notifications
    const notifications = await db
      .collection('notifications')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count of notifications
    const totalCount = await db.collection('notifications').countDocuments(filter);
    
    // Get count of unread notifications
    const unreadCount = await db.collection('notifications').countDocuments({
      userId: decoded.userId,
      isRead: false
    });
    
    // Log activity
    auditService.logUserAction(
      decoded.userId,
      decoded.userId, // Using userId as name since name might not be available
      decoded.role,
      'view',
      'system',
      undefined,
      'User viewed notifications'
    );
    
    // Return response
    return NextResponse.json({
      success: true,
      data: notifications,
      meta: {
        total: totalCount,
        unread: unreadCount
      }
    });
  } catch (error: any) {
    console.error(`Notifications API Error: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 