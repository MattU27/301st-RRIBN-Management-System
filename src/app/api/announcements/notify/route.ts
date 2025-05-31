import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/utils/auth';
import { UserRole } from '@/types/auth';
import { WebSocketEventType } from '@/utils/websocketService';
import { sendNotificationToUser, broadcastNotification } from '@/app/api/ws/route';

// Add dynamic directive to ensure route is dynamic
export const dynamic = 'force-dynamic';

/**
 * POST handler to send announcement notifications
 */
export async function POST(req: NextRequest) {
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
    
    // Check if user has permission to create announcements
    const isAdmin = decoded.role === UserRole.ADMINISTRATOR || decoded.role === UserRole.DIRECTOR;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to send announcements' },
        { status: 403 }
      );
    }
    
    // Get announcement data from request body
    const data = await req.json();
    const { announcementId, title, content, priority, userIds } = data;
    
    if (!announcementId || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: announcementId, title, content' },
        { status: 400 }
      );
    }
    
    // Create notification payload
    const notificationPayload = {
      _id: announcementId,
      title,
      content,
      priority: priority || 'medium',
      createdAt: new Date().toISOString(),
      authorName: 'Administrator'
    };
    
    // If userIds array is provided, send to specific users
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send notification to each user
      let successCount = 0;
      for (const userId of userIds) {
        const success = sendNotificationToUser(
          userId,
          WebSocketEventType.ANNOUNCEMENT_CREATED,
          notificationPayload
        );
        if (success) successCount++;
      }
      
      return NextResponse.json({
        success: true,
        message: `Announcement notification sent to ${successCount} out of ${userIds.length} users`
      });
    } else {
      // Broadcast to all connected users
      const success = broadcastNotification(
        WebSocketEventType.ANNOUNCEMENT_CREATED,
        notificationPayload
      );
      
      return NextResponse.json({
        success,
        message: success ? 'Announcement notification broadcast to all users' : 'Failed to broadcast announcement'
      });
    }
  } catch (error: any) {
    console.error('Error sending announcement notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 