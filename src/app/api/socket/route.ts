import { NextResponse } from 'next/server';

// This route is just a placeholder for the Socket.IO connection
// The actual WebSocket handling is done in the custom server.js file
export async function GET() {
  return NextResponse.json(
    { success: true, message: 'Socket.IO server is running' },
    { status: 200 }
  );
} 