import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getFileFromGridFS, getFileMetadata } from '@/lib/gridfs';
import Policy from '@/models/Policy';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

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

    // Check if the file exists in GridFS
    try {
      // Get file metadata to verify it exists
      const fileMetadata = await getFileMetadata(new ObjectId(policy.fileId.toString()));
      
      // Return diagnostic information
      return NextResponse.json({
        success: true,
        policy: {
          id: policy._id,
          title: policy.title,
          fileId: policy.fileId
        },
        file: {
          id: fileMetadata._id,
          filename: fileMetadata.filename,
          contentType: fileMetadata.contentType,
          length: fileMetadata.length
        },
        accessMethods: {
          byPolicyId: `/api/v1/policies/document/${policy._id}`,
          byFileId: `/api/v1/policies/file/${policy.fileId}`
        }
      });
    } catch (error) {
      console.error('Error retrieving file metadata from GridFS:', error);
      return NextResponse.json(
        { 
          error: 'File not found in GridFS',
          policyId: policy._id,
          fileId: policy.fileId,
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error in policy document check:', error);
    
    return NextResponse.json(
      { error: 'Failed to check policy document', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 