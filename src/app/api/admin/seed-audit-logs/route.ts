import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { validateToken } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

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
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    
    // Get user info from the request body
    const body = await request.json();
    const { userId, userName, userRole } = body;
    
    // Check if required fields are provided
    if (!userId || !userName || !userRole) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: userId, userName, userRole'
      }, { status: 400 });
    }
    
    // Define sample logs - create realistic log entries spanning different actions
    const now = new Date();
    const sampleLogs = [
      // Login events
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
        userId,
        userName,
        userRole: 'administrator',
        action: 'login',
        resource: 'user',
        details: 'Administrator login successful',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        userId,
        userName: 'TSgt. Ricardo Santos',
        userRole: 'staff',
        action: 'login',
        resource: 'user',
        details: 'Staff login successful',
        ipAddress: '192.168.1.2',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      
      // Personnel management
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5 + 3600000), // 5 days ago + 1 hour
        userId,
        userName,
        userRole: 'administrator',
        action: 'create',
        resource: 'personnel',
        resourceId: new mongoose.Types.ObjectId().toString(),
        details: 'Created personnel record: PFC Ernesto De Guzman',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5 + 7200000), // 5 days ago + 2 hours
        userId,
        userName,
        userRole: 'administrator',
        action: 'update',
        resource: 'personnel',
        resourceId: new mongoose.Types.ObjectId().toString(),
        details: 'Updated personnel record: Cpt. Maria Santos - Changed rank from 1LT to CPT',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      
      // Document management
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
        userId,
        userName: 'SSg. Marco Bonifacio',
        userRole: 'staff',
        action: 'upload',
        resource: 'document',
        resourceId: new mongoose.Types.ObjectId().toString(),
        details: 'Uploaded document: AFP_Training_Certificate_KAMANDAG_2023.pdf',
        ipAddress: '192.168.1.3',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4 + 3600000), // 4 days ago + 1 hour
        userId,
        userName,
        userRole: 'administrator',
        action: 'verify',
        resource: 'document',
        resourceId: new mongoose.Types.ObjectId().toString(),
        details: 'Verified document: Medical_Clearance_Camp_Aguinaldo.pdf',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      
      // Training activities
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        userId,
        userName,
        userRole: 'administrator',
        action: 'create',
        resource: 'training',
        resourceId: new mongoose.Types.ObjectId().toString(),
        details: 'Created training: Joint Maritime Security Exercise 2023',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        userId,
        userName: 'TSgt. Ana Reyes',
        userRole: 'staff',
        action: 'update',
        resource: 'training',
        resourceId: new mongoose.Types.ObjectId().toString(),
        details: 'Updated training: Humanitarian Assistance and Disaster Response Workshop - Changed venue to Camp Emilio Aguinaldo',
        ipAddress: '192.168.1.4',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      
      // System configuration
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
        userId,
        userName,
        userRole: 'administrator',
        action: 'update',
        resource: 'system',
        details: 'Updated system configuration: Changed password policy, Enabled two-factor authentication for all personnel',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      
      // Recent activities (today)
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
        userId,
        userName: 'TSgt. Ricardo Santos',
        userRole: 'staff',
        action: 'login',
        resource: 'user',
        details: 'Staff login successful',
        ipAddress: '192.168.1.2',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4), // 4 hours ago
        userId,
        userName: 'SSg. Marco Bonifacio',
        userRole: 'staff',
        action: 'view',
        resource: 'personnel',
        details: 'Viewed personnel list for 2nd Infantry Division',
        ipAddress: '192.168.1.3',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3), // 3 hours ago
        userId,
        userName,
        userRole: 'administrator',
        action: 'download',
        resource: 'report',
        details: 'Downloaded Balikatan Exercise 2023 readiness report',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 minutes ago
        userId,
        userName,
        userRole: 'administrator',
        action: 'update',
        resource: 'personnel',
        resourceId: new mongoose.Types.ObjectId().toString(),
        details: 'Updated personnel record: Sgt. Pedro Lopez - Updated deployment status to active in Zamboanga',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      {
        timestamp: new Date(now.getTime() - 1000 * 60 * 10), // 10 minutes ago
        userId,
        userName,
        userRole: 'administrator',
        action: 'view',
        resource: 'system',
        details: 'Viewed system audit logs',
        ipAddress: '192.168.1.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    ];
    
    // Insert sample logs
    await AuditLog.insertMany(sampleLogs);
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${sampleLogs.length} sample audit log entries`,
      count: sampleLogs.length
    });
  } catch (error) {
    console.error('Error seeding audit logs:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to seed audit logs', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 