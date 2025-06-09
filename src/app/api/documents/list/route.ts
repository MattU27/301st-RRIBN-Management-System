import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyJWT } from '@/utils/auth';

export async function GET(request: Request) {
  try {
    // Connect to MongoDB directly
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db');
      console.log('Connected to MongoDB');
    }
    
    // Ensure we have a database connection
    if (!mongoose.connection.readyState) {
      throw new Error('Failed to connect to MongoDB');
    }
    
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
    if (decoded.role === 'admin' || decoded.role === 'director' || decoded.role === 'administrator' || decoded.role === 'staff') {
      // Admin can see all documents or filter by specific user
      if (userId) {
        query.userId = userId;
      }
    } else {
      // Regular users can only see their own documents
      query.userId = decoded.userId;
    }
    
    // Get documents collection directly
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const documentsCollection = db.collection('documents');
    
    // Execute query
    const documents = await documentsCollection.find(query).sort({ uploadDate: -1, createdAt: -1 }).toArray();
    
    console.log(`Found ${documents.length} documents`);
    
    // Process documents for client
    const processedDocuments = await Promise.all(documents.map(async (doc: any) => {
      try {
        // Process GridFS URLs
        if (doc.fileUrl && doc.fileUrl.startsWith('gridfs://')) {
          const fileId = doc.fileUrl.replace('gridfs://', '');
          doc.fileUrl = `/api/files/${fileId}`;
        }
        
        // Format dates
        if (doc.uploadDate) {
          try {
            doc.uploadDate = new Date(doc.uploadDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch (error) {
            console.error('Error formatting upload date:', error);
            doc.uploadDate = 'Invalid date';
          }
        }
        
        if (doc.verifiedDate) {
          try {
            doc.verifiedDate = new Date(doc.verifiedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch (error) {
            console.error('Error formatting verified date:', error);
            doc.verifiedDate = 'Invalid date';
          }
        }
        
        // Lookup uploader information
        if (doc.userId) {
          try {
            // Validate userId is a valid ObjectId
            if (!mongoose.isValidObjectId(doc.userId)) {
              console.warn(`Invalid user ID format: ${doc.userId}`);
              doc.uploadedBy = {
                firstName: 'Unknown',
                lastName: 'User',
                serviceId: 'N/A'
              };
              return doc;
            }
            
            // Try users collection first
            const usersCollection = db.collection('users');
            const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(doc.userId) });
            
            if (user) {
              doc.uploadedBy = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                serviceId: user.serviceId,
                company: user.company
              };
            } else {
              // Try personnel collection
              const personnelCollection = db.collection('personnels');
              const personnel = await personnelCollection.findOne({ _id: new mongoose.Types.ObjectId(doc.userId) });
              
              if (personnel) {
                doc.uploadedBy = {
                  _id: personnel._id,
                  firstName: personnel.firstName,
                  lastName: personnel.lastName,
                  serviceId: personnel.serviceNumber,
                  company: personnel.company
                };
              } else {
                // Use generic info if user not found
                doc.uploadedBy = {
                  firstName: 'Unknown',
                  lastName: 'User',
                  serviceId: 'N/A'
                };
              }
            }
          } catch (error) {
            console.error('Error looking up user:', error);
            // Use generic info if error occurs
            doc.uploadedBy = {
              firstName: 'Unknown',
              lastName: 'User',
              serviceId: 'N/A'
            };
          }
        }
        
        return doc;
      } catch (error) {
        console.error('Error processing document:', error);
        // Return a safe version of the document
        return {
          _id: doc._id,
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
