import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Document from '@/models/Document';
import { verifyJWT } from '@/utils/auth';

/**
 * GET handler to retrieve documents for the current user or all documents for admins
 */
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    
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
    
    // Build query
    const query: any = {};
    
    // Filter by status if provided
    if (status && ['verified', 'pending', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    // Filter by type if provided
    if (type) {
      query.type = type;
    }
    
    // Filter by user ID (admins can see all documents, users can only see their own)
    if (decoded.role === 'admin' || decoded.role === 'director') {
      // Admin can see all documents or filter by specific user
      if (userId) {
        query.userId = userId;
      }
    } else {
      // Regular users can only see their own documents
      query.userId = decoded.userId;
    }
    
    // Execute query
    const documents = await Document.find(query)
      .sort({ uploadDate: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      data: {
        documents
      }
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching documents' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new document
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
    
    // Get data from request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.type || !data.fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Map frontend document type to schema enum values
    const documentTypeMapping: { [key: string]: string } = {
      'Personal Information': 'other',
      'Medical Certificate': 'medical_record',
      'Training Certificate': 'training_certificate',
      'Identification': 'identification',
      'Educational Background': 'other',
      'Military Training': 'training_certificate',
      'Other': 'other',
      'Promotion': 'promotion',
      'Commendation': 'commendation'
    };
    
    // Extract file name, mime type and size from fileUrl if not provided
    const fileName = data.fileName || data.name;
    const mimeType = data.mimeType || 'application/octet-stream';
    const fileSize = data.fileSize || 0;
    
    // Create new document
    const newDocument = {
      title: data.name, // Use name as title
      name: data.name,
      description: data.description || '',
      type: documentTypeMapping[data.type] || 'other',
      fileUrl: data.fileUrl,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: mimeType,
      userId: decoded.userId,
      uploadedBy: decoded.userId, // Use the same user ID for both
      status: 'pending', // All uploads start as pending
      uploadDate: new Date(),
      securityClassification: data.securityClassification || 'Unclassified',
      expirationDate: data.expirationDate || undefined,
      version: 1
    };
    
    // Save to database
    const result = await Document.create(newDocument);
    
    return NextResponse.json({
      success: true,
      data: {
        document: result
      }
    });
  } catch (error: any) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error creating document' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update a document (e.g., verify, reject)
 */
export async function PUT(request: Request) {
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
    
    // Check if user has permission to verify/reject documents
    if (decoded.role !== 'admin' && decoded.role !== 'director' && decoded.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get data from request body
    const data = await request.json();
    const { id, status, comments } = data;
    
    if (!id || !status || !['verified', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID or status' },
        { status: 400 }
      );
    }
    
    // Update document
    const updateData: any = {
      status
    };
    
    // Add verifier information for verified documents
    if (status === 'verified') {
      updateData.verifiedBy = decoded.userId;
      updateData.verifiedDate = new Date();
    }
    
    // Add comments for rejected documents
    if (status === 'rejected' && comments) {
      updateData.comments = comments;
    }
    
    const result = await Document.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        document: result
      }
    });
  } catch (error: any) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error updating document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a document
 */
export async function DELETE(request: Request) {
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
    
    // Get the ID from the URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Find document first to check ownership
    const document = await Document.findById(id);
    
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the document or is an admin
    if (document.userId.toString() !== decoded.userId && 
        decoded.role !== 'admin' && 
        decoded.role !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Delete the document
    await Document.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error deleting document' },
      { status: 500 }
    );
  }
} 