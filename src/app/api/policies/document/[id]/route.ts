import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getFileFromGridFS, getFileMetadata } from '@/lib/gridfs';
import Policy from '@/models/Policy';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum execution time to 60 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication token from cookies or Authorization header
    let token = request.cookies.get('token')?.value;
    if (!token) {
      token = request.headers.get('Authorization')?.split(' ')[1] || '';
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await validateToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get the policy ID from the URL params
    const policyId = params.id;
    if (!policyId) {
      return NextResponse.json(
        { error: 'Policy ID is required' },
        { status: 400 }
      );
    }

    // Lookup the policy to get the fileId
    const policy = await Policy.findById(policyId);
    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    // If policy has no fileId, return an error
    if (!policy.fileId) {
      return NextResponse.json(
        { error: 'No document associated with this policy' },
        { status: 404 }
      );
    }

    try {
      // Get file metadata first to get content type
      const fileMetadata = await getFileMetadata(new ObjectId(policy.fileId.toString()));
      
      // Get the file from GridFS
      const fileBuffer = await getFileFromGridFS(new ObjectId(policy.fileId.toString()));

      // Determine if the request asks for download or inline display
      const searchParams = new URL(request.url).searchParams;
      const isDownload = searchParams.get('download') === 'true';

      // Create the response with the file
      const response = new NextResponse(Buffer.from(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': fileMetadata.contentType || 'application/pdf',
          'Content-Disposition': isDownload 
            ? `attachment; filename="${policy.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"` 
            : 'inline',
          'Cache-Control': 'public, max-age=86400'
        }
      });

      return response;
    } catch (error) {
      console.error('Error retrieving file from GridFS:', error);
      return NextResponse.json(
        { error: 'Error retrieving document' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in policy document retrieval:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve policy document' },
      { status: 500 }
    );
  }
} 