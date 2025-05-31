import { NextRequest } from 'next/server';
import { verifyJWT } from '@/utils/auth';

// Map to store active WebSocket connections by user ID
const activeConnections = new Map<string, any>();

export function GET(request: NextRequest) {
  try {
    // Check if the request is a WebSocket upgrade request
    const { socket: ws, response } = (request as any)?.socket?.server?.upgrade(
      request,
      {
        // Return protocol to be used by WebSocket
        protocol: request.headers.get('sec-websocket-protocol') || undefined
      }
    ) || {};

    if (!ws) {
      // If not a WebSocket request, return error
      return new Response('Expected a WebSocket request', { status: 400 });
    }

    // Get user ID from query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      ws.close(1008, 'User ID required for authentication');
      return response;
    }

    // Store the WebSocket connection in our map
    activeConnections.set(userId, ws);
    console.log(`WebSocket: User ${userId} connected. Total active connections: ${activeConnections.size}`);

    // Set up disconnect handler
    ws.onclose = () => {
      activeConnections.delete(userId);
      console.log(`WebSocket: User ${userId} disconnected. Total active connections: ${activeConnections.size}`);
    };

    return response;
  } catch (error) {
    console.error('WebSocket connection error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Helper function to send a notification to a specific user
export function sendNotificationToUser(userId: string, eventType: string, payload: any) {
  console.log(`WebSocket: Sending ${eventType} notification to user ${userId}`);
  console.log(`WebSocket: Payload:`, JSON.stringify(payload));
  
  // Special handling for deactivation events
  if (eventType === 'ACCOUNT_DEACTIVATED') {
    // Ensure reason is never undefined or null
    if (payload.reason === undefined || payload.reason === null) {
      console.log(`WebSocket: No deactivation reason provided for user ${userId}, setting default`);
      payload.reason = 'No reason provided';
    }
    
    console.log(`WebSocket: Final deactivation reason for user ${userId}: "${payload.reason}"`);
  }
  
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === 1) { // 1 = OPEN
    try {
      const message = JSON.stringify({ type: eventType, payload });
      ws.send(message);
      console.log(`WebSocket: Successfully sent ${eventType} message to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`WebSocket: Error sending notification to user ${userId}:`, error);
      return false;
    }
  } else {
    console.log(`WebSocket: Cannot send to user ${userId} - ${ws ? 'not open' : 'not connected'}`);
    
    // For debugging, store information somewhere even if WebSocket is not connected
    if (eventType === 'ACCOUNT_DEACTIVATED') {
      try {
        // This is a server-side implementation, we can't use sessionStorage here
        console.log(`WebSocket: User ${userId} is not connected. Would store deactivation reason: "${payload.reason}"`);
        // You might want to store this in the database or another persistent storage
      } catch (error) {
        console.error(`WebSocket: Error storing deactivation information:`, error);
      }
    }
  }
  return false;
}

// Helper function to broadcast to all connected users
export function broadcastNotification(eventType: string, payload: any) {
  let successCount = 0;
  activeConnections.forEach((ws, userId) => {
    if (ws.readyState === 1) { // 1 = OPEN
      try {
        ws.send(JSON.stringify({ type: eventType, payload }));
        successCount++;
      } catch (error) {
        console.error(`WebSocket: Error broadcasting to user ${userId}:`, error);
      }
    }
  });
  console.log(`WebSocket: Broadcast ${eventType} to ${successCount}/${activeConnections.size} users`);
  return successCount;
} 