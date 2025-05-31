import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { validateToken } from '@/lib/auth';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

// Define route segment config
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get query parameters
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const resource = url.searchParams.get('resource');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const searchTerm = url.searchParams.get('searchTerm');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Validate token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication token is required' }, { status: 401 });
    }
    
    const decoded = await validateToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    
    // Build query
    const query: any = {
      // Filter out director/Super Director roles
      userRole: { $nin: ['director', 'Super Director'] }
    };
    
    if (action) {
      query.action = action;
    }
    
    if (resource) {
      query.resource = resource;
    }
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.timestamp = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.timestamp = { $lte: new Date(endDate) };
    }
    
    if (searchTerm) {
      query.$or = [
        { userName: { $regex: searchTerm, $options: 'i' } },
        { userRole: { $regex: searchTerm, $options: 'i' } },
        { details: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Fetch audit logs with pagination
    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await AuditLog.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch audit logs', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

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
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.action || !body.resource || !body.userId || !body.userName || !body.userRole) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: action, resource, userId, userName, userRole'
      }, { status: 400 });
    }
    
    // Create new audit log
    const auditLog = new AuditLog({
      timestamp: new Date(),
      userId: body.userId,
      userName: body.userName,
      userRole: body.userRole,
      action: body.action,
      resource: body.resource,
      resourceId: body.resourceId,
      details: body.details,
      ipAddress: body.ipAddress || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: body.userAgent || request.headers.get('user-agent') || 'unknown'
    });
    
    await auditLog.save();
    
    return NextResponse.json({
      success: true,
      message: 'Audit log created successfully',
      data: auditLog
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create audit log', 
      error: (error as Error).message 
    }, { status: 500 });
  }
} 