import { NextResponse } from 'next/server';
import { verifyJWT } from '@/utils/auth';

/**
 * POST handler to upload a certificate for a reservist
 */
export async function POST(request: Request) {
  try {
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
    
    // Process multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const reservistId = formData.get('reservistId') as string;
    
    // Validate required fields
    if (!file || !title || !type || !reservistId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // TODO: Implement file storage to a cloud service or server file system
    // For now, we'll return a mock success response
    
    // Generate a random ID for the mock certificate
    const certificateId = Math.random().toString(36).substring(2, 15);
    
    return NextResponse.json({
      success: true,
      certificate: {
        id: certificateId,
        title,
        type,
        uploadDate: new Date().toISOString(),
        fileUrl: '/mock-certificate.pdf', // This would be the actual URL to the stored file
        fileName: file.name,
        fileSize: file.size,
        status: 'pending'
      }
    });
    
  } catch (error: any) {
    console.error('Error uploading certificate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while uploading the certificate' },
      { status: 500 }
    );
  }
} 