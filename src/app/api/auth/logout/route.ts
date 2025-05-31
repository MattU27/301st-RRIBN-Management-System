import { NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';
import connectToDatabase from '@/lib/mongoose';
import User, { IUser } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Get token from the request
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    // If no token, just return success (they're already logged out)
    if (!token) {
      return logoutResponse();
    }
    
    // Log the logout to audit system
    try {
      // Connect to MongoDB
      await connectToDatabase();
      
      // Validate token to get user info
      const decoded = await validateToken(token);
      
      if (decoded && decoded.userId) {
        // Check if we already have a logout log for this user within the last 5 seconds
        // This prevents duplicate entries from client-side and server-side logging
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        const existingLogout = await AuditLog.findOne({
          userId: decoded.userId,
          action: 'logout',
          resource: 'user',
          timestamp: { $gte: fiveSecondsAgo }
        });
        
        // Only create a new log if no recent logout exists
        if (!existingLogout) {
          // Get full user details from the database
          const user = await User.findById(decoded.userId);
          
          // Extract user information, using fallbacks if user not found
          const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';
          const userRole = user ? user.role : (decoded.role || 'Unknown');
          const userRank = user && user.rank ? `${user.rank} ` : '';
          const userCompany = user && user.company ? ` (${user.company})` : '';
          
          // Create audit log entry
          const auditLog = new AuditLog({
            timestamp: new Date(),
            userId: decoded.userId,
            userName: userName,
            userRole: userRole,
            action: 'logout',
            resource: 'user',
            details: `${userRank}${userName}${userCompany} logged out`,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          });
          
          await auditLog.save();
          console.log('Logout event logged to audit system');
        } else {
          console.log('Skipping duplicate logout log entry');
        }
      }
    } catch (auditError) {
      // Don't fail the logout if audit logging fails
      console.error('Error logging logout to audit system:', auditError);
    }
    
    return logoutResponse();
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}

// Helper function to create a consistent logout response
function logoutResponse() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
  
  // Clear the token cookie
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    expires: new Date(0), // Expire immediately
    path: '/',
    sameSite: 'strict',
  });
  
  return response;
} 