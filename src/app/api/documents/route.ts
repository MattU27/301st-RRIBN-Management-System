import { NextResponse } from 'next/server';
import { dbConnect, getNativeDb } from '@/utils/dbConnect';
import Document from '@/models/Document';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';
import { emitSocketEvent } from '@/utils/socket';
import { GridFSBucket } from 'mongodb';

/**
 * GET handler to retrieve documents for the current user or all documents for admins
 */
export async function GET(request: Request) {
  let gridFSBucket = null;
  
  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Connected to database');
    
    // Initialize GridFS
    try {
      const db = getNativeDb();
      if (db) {
        gridFSBucket = new GridFSBucket(db);
        console.log('GridFS bucket initialized');
      }
    } catch (gridFsError) {
      console.error('Error initializing GridFS bucket:', gridFsError);
      // Continue without GridFS - we'll handle files differently
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    
    console.log('Query parameters:', { status, userId, type });
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Add try-catch for token verification
    let decoded;
    try {
      decoded = await verifyJWT(token) as { userId: string; role: string; email?: string };
      
      if (!decoded) {
        console.log('Invalid token');
        return NextResponse.json(
          { success: false, error: 'Invalid token' },
          { status: 401 }
        );
      }
    } catch (error: any) {
      console.log('Error verifying token:', error.message);
      return NextResponse.json(
        { success: false, error: 'Invalid token: ' + error.message },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', { userId: decoded.userId, role: decoded.role });
    
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
    if (decoded.role === 'admin' || decoded.role === 'director' || decoded.role === 'administrator' || decoded.role === 'staff') {
      // Admin can see all documents or filter by specific user
      if (userId) {
        query.userId = userId;
      }
    } else {
      // Regular users can only see their own documents
      query.userId = decoded.userId;
    }
    
    console.log('Query:', query);
    
    // Execute query with populated uploadedBy field
    let documents;
    try {
      documents = await Document.find(query)
        .populate([
          {
            path: 'uploadedBy',
            select: 'firstName lastName serviceId company email',
            model: 'User'
          },
          {
            path: 'uploadedBy',
            select: 'firstName lastName serviceNumber company email',
            model: 'Personnel'
          }
        ])
        .populate({
          path: 'verifiedBy',
          select: 'firstName lastName'
        })
        .sort({ uploadDate: -1, createdAt: -1 })
        .lean();
      
      console.log(`Found ${documents.length} documents`);
    } catch (error: any) {
      console.error('Error querying documents:', error);
      return NextResponse.json(
        { success: false, error: 'Error querying documents: ' + error.message },
        { status: 500 }
      );
    }
    
    // Format dates and ensure all documents have proper uploadedBy information
    const processedDocuments = await Promise.all(documents.map(async doc => {
      try {
        // Handle GridFS file URLs if present
        if (doc.fileUrl && typeof doc.fileUrl === 'string' && doc.fileUrl.startsWith('gridfs://')) {
          try {
            const fileId = doc.fileUrl.replace('gridfs://', '');
            console.log(`Document ${doc._id} has GridFS fileUrl: ${fileId}`);
            
            // Check if the file exists in GridFS
            if (gridFSBucket) {
              try {
                const db = getNativeDb();
                if (db) {
                  const file = await db.collection('fs.files').findOne({
                    _id: new mongoose.Types.ObjectId(fileId)
                  });
                  
                  if (file) {
                    console.log(`GridFS file found for document ${doc._id}`);
                  } else {
                    console.log(`GridFS file not found for document ${doc._id}`);
                  }
                }
              } catch (error) {
                console.error(`Error checking GridFS file for document ${doc._id}:`, error);
              }
            }
            
            // We'll keep the GridFS URL but ensure it's properly formatted
            // In a production app, you might want to generate a temporary URL or serve the file directly
            doc.fileUrl = `/api/files/${fileId}`;
          } catch (error) {
            console.error(`Error processing GridFS URL for document ${doc._id}:`, error);
            // Provide a fallback URL
            doc.fileUrl = '#';
          }
        }
        
        // Format dates as strings for consistent display
        try {
          if (doc.uploadDate) {
            doc.uploadDate = new Date(doc.uploadDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } else if (doc.createdAt) {
            doc.uploadDate = new Date(doc.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } else {
            doc.uploadDate = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
        } catch (dateError) {
          console.error(`Error formatting date for document ${doc._id}:`, dateError);
          doc.uploadDate = 'Unknown date';
        }
        
        try {
          if (doc.verifiedDate) {
            doc.verifiedDate = new Date(doc.verifiedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
        } catch (dateError) {
          console.error(`Error formatting verified date for document ${doc._id}:`, dateError);
          doc.verifiedDate = '';
        }
        
        // Handle case where uploadedBy is not populated or is a string ID
        if (!doc.uploadedBy || typeof doc.uploadedBy === 'string' || (doc.uploadedBy && !doc.uploadedBy.firstName)) {
          console.log(`Document ${doc._id} has unpopulated uploadedBy: ${doc.uploadedBy}`);
          
          // Use a generic Unknown User to prevent errors
          doc.uploadedBy = {
            firstName: 'Unknown',
            lastName: 'User',
            serviceId: 'N/A'
          };
          
          // Try to use userId if available
          if (doc.userId) {
            console.log(`Using userId ${doc.userId} as fallback`);
            
            let userId = doc.userId;
            let validObjectId = false;
            
            // If userId is a string but not 'current_user', try to convert to ObjectId
            if (typeof userId === 'string' && userId !== 'current_user') {
              try {
                // Check if the userId is a valid ObjectId before conversion
                if (mongoose.Types.ObjectId.isValid(userId)) {
                  userId = new mongoose.Types.ObjectId(userId);
                  validObjectId = true;
                  console.log(`Converted userId to ObjectId: ${userId}`);
                } else {
                  console.log(`Invalid ObjectId format: ${userId}`);
                  return doc;
                }
              } catch (err) {
                console.log(`Error converting userId to ObjectId: ${err}`);
                return doc;
              }
            } else if (typeof userId === 'string' && userId === 'current_user') {
              console.log('userId is "current_user", using generic Unknown User');
              return doc;
            }
            
            // Only proceed with database lookup if we have a valid ObjectId
            if (validObjectId) {
              try {
                // Try to find the user in both collections
                const db = await dbConnect();
                
                // First try the users collection
                const User = mongoose.model('User');
                let user = null;
                
                try {
                  console.log(`Looking for user with ID: ${userId}`);
                  user = await User.findById(userId).select('firstName lastName serviceId company email').lean();
                  if (user) {
                    console.log(`Found user in users collection: ${(user as any).firstName} ${(user as any).lastName}`);
                  } else {
                    console.log('User not found in users collection');
                  }
                } catch (err) {
                  console.log(`Error finding user: ${err}`);
                }
                
                // If not found in users, try personnels collection
                if (!user) {
                  console.log(`User not found in users collection, trying personnels collection`);
                  const Personnel = mongoose.model('Personnel');
                  try {
                    // Use any type to bypass TypeScript's strict checking
                    const personnelUser: any = await Personnel.findById(userId).select('firstName lastName serviceNumber company email').lean();
                    
                    if (personnelUser) {
                      console.log(`Found personnel: ${personnelUser.firstName} ${personnelUser.lastName}`);
                      // Create a new object with the required fields
                      user = {
                        firstName: personnelUser.firstName,
                        lastName: personnelUser.lastName,
                        serviceId: personnelUser.serviceNumber, // Map serviceNumber to serviceId
                        company: personnelUser.company,
                        email: personnelUser.email
                      } as any;
                    } else {
                      console.log('Personnel not found with ID:', userId);
                    }
                  } catch (err) {
                    console.log(`Error finding personnel: ${err}`);
                  }
                }
                
                if (user) {
                  console.log(`Found user: ${(user as any).firstName || 'Unknown'} ${(user as any).lastName || 'User'}`);
                  doc.uploadedBy = user;
                }
              } catch (error) {
                console.error('Error during user lookup:', error);
              }
            }
          }
        } else if (doc.uploadedBy && (doc.uploadedBy as any).serviceNumber && !(doc.uploadedBy as any).serviceId) {
          // If we have a populated uploadedBy from Personnel model, map serviceNumber to serviceId
          console.log(`Mapping serviceNumber to serviceId for document ${doc._id}`);
          (doc.uploadedBy as any).serviceId = (doc.uploadedBy as any).serviceNumber;
        }
        
        // Map document type if it's not one of the standard types
        if (doc.type && !['training_certificate', 'medical_record', 'identification', 'promotion', 'commendation', 'other'].includes(doc.type)) {
          // Map to a standard type
          const typeMapping: { [key: string]: string } = {
            'Birth Certificate': 'other',
            'ID Card': 'identification',
            'Picture 2x2': 'identification',
            '3R ROTC Certificate': 'training_certificate',
            'Enlistment Order': 'other',
            'Promotion Order': 'promotion',
            'Order of Incorporation': 'other',
            'Schooling Certificate': 'training_certificate',
            'College Diploma': 'training_certificate',
            'RIDS': 'other',
            'Deployment Order': 'other',
            'Medical Certificate': 'medical_record',
            'Training Certificate': 'training_certificate',
            'Commendation': 'commendation',
            'Other': 'other'
          };
          
          doc.type = typeMapping[doc.type] || 'other';
        }
        
        return doc;
      } catch (error) {
        console.error(`Error processing document:`, error);
        // Return a safe copy of the document with generic uploadedBy information
        // to prevent the entire request from failing
        return {
          _id: doc._id || 'unknown',
          name: doc.name || 'Unknown document',
          type: doc.type || 'other',
          status: doc.status || 'pending',
          uploadDate: 'Unknown date',
          fileUrl: '#',
          uploadedBy: {
            firstName: 'Unknown',
            lastName: 'User',
            serviceId: 'N/A'
          }
        };
      }
    }));
    
    // Log a sample document to check if uploadedBy is populated
    if (processedDocuments.length > 0) {
      console.log('Sample document:', JSON.stringify(processedDocuments[0], null, 2));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        documents: processedDocuments
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
    console.log('Connected to database for document creation');
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token) as { userId: string; role: string; email?: string };
    
    if (!decoded) {
      console.log('Invalid token');
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated for document upload:', { userId: decoded.userId, role: decoded.role });
    
    // Get data from request body
    const data = await request.json();
    console.log('Document upload data:', { ...data, fileUrl: data.fileUrl ? '(truncated)' : undefined });
    
    // Validate required fields
    if (!data.name || !data.type || !data.fileUrl) {
      console.log('Missing required fields:', { name: !!data.name, type: !!data.type, fileUrl: !!data.fileUrl });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Handle userId from mobile app
    let userId = decoded.userId;
    
    // If the request includes a userId and it's from a staff/admin/director, allow setting a different userId
    if (data.userId && ['admin', 'director', 'staff'].includes(decoded.role)) {
      console.log(`Staff/admin setting document for user ID: ${data.userId}`);
      userId = data.userId;
    } else if (data.userId === 'current_user') {
      // This is from the mobile app, we need to find a personnel record to associate with
      console.log(`Mobile app upload with 'current_user', finding appropriate personnel record`);
      
      try {
        // Try to find a personnel record with the email from the token
        const Personnel = mongoose.model('Personnel');
        const personnel = await Personnel.findOne({ email: decoded.email }).lean() as any;
        
        if (personnel) {
          console.log(`Found personnel record for email ${decoded.email}: ${personnel._id}`);
          userId = personnel._id;
        } else {
          // Try to find John Matthew Banto's record as fallback
          const defaultPersonnel = await Personnel.findOne({ serviceNumber: '2019-10180' }).lean() as any;
          
          if (defaultPersonnel) {
            console.log(`Using default personnel record (John Matthew Banto): ${defaultPersonnel._id}`);
            userId = defaultPersonnel._id;
          } else {
            console.log(`No default personnel found, using token userId: ${decoded.userId}`);
          }
        }
      } catch (error) {
        console.error('Error finding personnel record:', error);
        // Continue with the decoded userId
      }
    } else if (data.userId && data.userId !== decoded.userId) {
      console.log(`Warning: User ${decoded.userId} attempted to set document for ${data.userId}. Using token userId instead.`);
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
      'Promotion Order': 'promotion',
      'Commendation': 'commendation',
      'College Diploma': 'training_certificate',
      'Birth Certificate': 'other',
      'ID Card': 'identification',
      'Picture 2x2': 'identification',
      '3R ROTC Certificate': 'training_certificate',
      'Enlistment Order': 'other',
      'Order of Incorporation': 'other',
      'Schooling Certificate': 'training_certificate',
      'RIDS': 'other',
      'Deployment Order': 'other'
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
      userId: userId,
      uploadedBy: userId, // Use the same user ID for both fields
      status: 'pending', // All uploads start as pending
      uploadDate: new Date(),
      expirationDate: data.expirationDate || undefined,
      version: 1
    };
    
    console.log('Creating new document with data:', { 
      ...newDocument,
      fileUrl: '(truncated)',
      userId: userId,
      uploadedBy: userId
    });
    
    // Save to database
    const result = await Document.create(newDocument);
    console.log('Document created successfully:', { id: result._id });
    
    // Emit socket event
    emitSocketEvent('document:new', result);
    
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
    const decoded = await verifyJWT(token) as { userId: string; role: string; email?: string };
    
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
    
    // Emit socket event
    emitSocketEvent('document:update', result);
    
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
    const decoded = await verifyJWT(token) as { userId: string; role: string; email?: string };
    
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
    
    // Emit socket event
    emitSocketEvent('document:delete', id);
    
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