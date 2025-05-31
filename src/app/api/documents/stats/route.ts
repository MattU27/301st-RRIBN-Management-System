import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Document, { DocumentStatus } from '@/models/Document';
import { verifyJWT } from '@/utils/auth';

/**
 * GET handler to retrieve document statistics
 */
export async function GET(request: Request) {
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
    
    // Get document counts by status
    const pendingCount = await Document.countDocuments({ status: DocumentStatus.PENDING });
    const verifiedCount = await Document.countDocuments({ status: DocumentStatus.VERIFIED });
    const rejectedCount = await Document.countDocuments({ status: DocumentStatus.REJECTED });
    
    // Get total count
    const totalCount = await Document.countDocuments();
    
    // Get document counts by type
    const documentTypes = await Document.distinct('documentType');
    
    const typeCountsPromises = documentTypes.map(async (type) => {
      const count = await Document.countDocuments({ documentType: type });
      return { type, count };
    });
    
    const typeCounts = await Promise.all(typeCountsPromises);
    
    // Build response data
    const stats = {
      total: totalCount,
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
      verificationRate: totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0,
      byType: typeCounts
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching document statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching document statistics' },
      { status: 500 }
    );
  }
} 