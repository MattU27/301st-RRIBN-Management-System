import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Personnel, { IPersonnel } from '@/models/Personnel';
import { checkPermission, DecodedToken } from '@/middleware/roleMiddleware';
import { verifyJWT } from '@/utils/auth';
import { Types } from 'mongoose';

// PATCH /api/personnel/status - Update personnel status
export async function PATCH(req: NextRequest) {
  try {
    // Verify authentication token
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    // Get user info from token
    const decoded = await verifyJWT(token) as DecodedToken;
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse the request body
    const data = await req.json();
    const { personnelId, status, reason } = data;
    
    const validStatuses = ['Ready', 'Standby', 'Retired'];
    if (!personnelId || !status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid request. Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get the personnel record to check company
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return NextResponse.json(
        { error: 'Personnel not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update status for this company
    const permissionCheck = await checkPermission(
      token, 
      'canUpdateStatus', 
      personnel.company instanceof Types.ObjectId ? personnel.company.toString() : undefined
    );
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 403 }
      );
    }

    // Update personnel status
    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      personnelId,
      {
        $set: {
          status,
          statusReason: reason,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: decoded.userId
        }
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: `Personnel status updated to ${status}`,
      data: updatedPersonnel
    });
  } catch (error) {
    console.error('Error updating personnel status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 