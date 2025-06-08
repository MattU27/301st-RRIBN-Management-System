import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getFileFromGridFS, getFileMetadata } from '@/lib/gridfs';
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

    // Get the file ID from the URL params
    const fileId = params.id;
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    console.log(`Retrieving file with ID: ${fileId}`);

    try {
      // Get file metadata first to get content type
      const fileMetadata = await getFileMetadata(new ObjectId(fileId));
      
      if (!fileMetadata) {
        console.error(`File metadata not found for ID: ${fileId}`);
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      
      console.log(`Found file metadata: ${fileMetadata.filename}, contentType: ${fileMetadata.contentType}`);
      
      // Get the file from GridFS
      const fileBuffer = await getFileFromGridFS(new ObjectId(fileId));

      // Determine if the request asks for download or inline display
      const searchParams = new URL(request.url).searchParams;
      const isDownload = searchParams.get('download') === 'true';

      // Create the response with the file
      const response = new NextResponse(Buffer.from(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': fileMetadata.contentType || 'application/pdf',
          'Content-Disposition': isDownload 
            ? `attachment; filename="${fileMetadata.filename}"` 
            : 'inline',
          'Cache-Control': 'public, max-age=86400'
        }
      });

      return response;
    } catch (error) {
      console.error('Error retrieving file from GridFS:', error);
      return NextResponse.json(
        { error: 'Error retrieving document', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in file retrieval:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve file', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 