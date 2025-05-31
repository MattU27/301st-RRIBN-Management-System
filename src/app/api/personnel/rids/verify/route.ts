import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import RIDS from '@/models/RIDS';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import { hasPermission } from '@/utils/rolePermissions';

/**
 * POST handler to verify a RIDS submission
 */
export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to manage documents
    if (!hasPermission(decoded.role, 'manage_documents')) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { reservistId, isApproved, reason } = body;
    
    if (!reservistId) {
      return NextResponse.json(
        { success: false, error: 'Reservist ID is required' },
        { status: 400 }
      );
    }
    
    // Find the reservist
    const reservist = await User.findById(reservistId).lean();
    
    if (!reservist) {
      return NextResponse.json(
        { success: false, error: 'Reservist not found' },
        { status: 404 }
      );
    }
    
    // Staff can only verify RIDS for reservists in their company
    if (decoded.role === 'staff' && decoded.company !== reservist.company) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: You can only verify RIDS for reservists in your company' },
        { status: 403 }
      );
    }
    
    // Find the RIDS document
    const ridsDoc = await RIDS.findOne({ userId: reservistId });
    
    if (!ridsDoc) {
      return NextResponse.json(
        { success: false, error: 'RIDS document not found for this reservist' },
        { status: 404 }
      );
    }
    
    // Update verification status
    if (isApproved) {
      ridsDoc.isVerified = true;
      ridsDoc.verificationDate = new Date();
      ridsDoc.verifiedBy = decoded.userId;
      ridsDoc.rejectionReason = '';
    } else {
      ridsDoc.isVerified = false;
      ridsDoc.isSubmitted = false; // Reset to draft state
      ridsDoc.rejectionReason = reason || 'Please update and resubmit your information';
    }
    
    // Save the updated document
    await ridsDoc.save();
    
    // Create a notification for the reservist
    // This would be implemented in a real system
    
    return NextResponse.json({
      success: true,
      message: isApproved 
        ? 'RIDS verified successfully' 
        : 'RIDS returned for revision',
      data: {
        ridsId: ridsDoc._id,
        status: isApproved ? 'verified' : 'incomplete'
      }
    });
  } catch (error: any) {
    console.error('Error verifying RIDS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error verifying RIDS' },
      { status: 500 }
    );
  }
} 