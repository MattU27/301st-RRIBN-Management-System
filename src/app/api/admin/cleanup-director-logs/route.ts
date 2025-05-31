import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { validateToken } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';

// Define route segment config
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Validate token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication token is required' }, { status: 401 });
    }
    
    const decoded = await validateToken(token);
    if (!decoded || !decoded.userId || decoded.role !== 'administrator') {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }
    
    // Delete all director logs
    const result = await AuditLog.deleteMany({
      userRole: { $in: ['director', 'Super Director'] }
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully removed ${result.deletedCount} director audit log entries`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up director logs:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to clean up director logs', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 