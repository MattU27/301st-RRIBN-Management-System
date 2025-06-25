import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { verifyJWT } from '@/utils/auth';
import { hasPermission, Permission } from '@/utils/rolePermissions';

/**
 * GET handler to allow the client to know the endpoint exists
 */
export async function GET() {
  return NextResponse.json({ message: 'PDF generation endpoint is active' });
}

/**
 * POST handler to generate a PDF for a RIDS
 * This endpoint is meant to be used client-side with jspdf
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
    
    // Check if user has permission to view documents
    if (!hasPermission(decoded.role, 'manage_documents' as Permission)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { ridsData } = body;
    
    if (!ridsData) {
      return NextResponse.json(
        { success: false, error: 'RIDS data is required' },
        { status: 400 }
      );
    }
    
    // Just return success and the processed data - PDF will be generated client-side
    return NextResponse.json({
      success: true,
      message: 'RIDS data validated successfully',
      data: ridsData
    });
    
  } catch (error: any) {
    console.error('Error processing RIDS data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing RIDS data' },
      { status: 500 }
    );
  }
} 