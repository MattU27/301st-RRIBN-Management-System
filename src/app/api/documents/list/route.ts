import { NextResponse } from 'next/server';
import { dbConnect, getNativeDb } from '@/utils/dbConnect';
import Document from '@/models/Document';
import User from '@/models/User';
import Personnel from '@/models/Personnel';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

/**
 * GET handler to retrieve documents with enhanced uploader information handling
 */
export async function GET(request: Request) {
  let gridFSBucket = null;
  
  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Connected to database for document list');
    
    // Initialize GridFS
    try {
      const db = getNativeDb();
      if (db) {
        gridFSBucket = new GridFSBucket(db);
        console.log('GridFS bucket initialized');
      }
    } catch (gridFsError) {
      console.error('Error initializing GridFS bucket:', gridFsError);
    }
    
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
    
    // Filter by user ID (admins can see all documents, users can only see their own)
    if (decoded.role === 'admin' || decoded.role === 'director' || decoded.role === 'administrator' || decoded.role === 'staff') {
      // Admin can see all documents
      console.log('Admin/staff user, showing all documents');
    } else {
      // Regular users can only see their own documents
      query.userId = decoded.userId;
      console.log(`Regular user, showing only documents for userId: ${decoded.userId}`);
    }
    
    // Execute query with populated uploadedBy field
    let documents;
    try {
      // Ensure models are registered
      try {
        if (!mongoose.models.User) {
          console.log('User model not registered, registering now');
          // If User model is not registered yet, we'll skip the populate for User
        }
        
        if (!mongoose.models.Personnel) {
          console.log('Personnel model not registered, registering now');
          // If Personnel model is not registered yet, we'll skip the populate for Personnel
        }
      } catch (modelError) {
        console.error('Error checking models:', modelError);
      }
      
      // Fetch documents without populate first
      documents = await Document.find(query)
        .sort({ uploadDate: -1, createdAt: -1 })
        .lean();
      
      console.log(`Found ${documents.length} documents`);
      
      // Process documents to manually handle the uploader information
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        // Check if uploadedBy is an ObjectId or string reference
        if (doc.uploadedBy && (typeof doc.uploadedBy === 'string' || doc.uploadedBy instanceof mongoose.Types.ObjectId)) {
          const uploaderId = doc.uploadedBy.toString();
          
          try {
            // Try to find the user directly using the native MongoDB connection
            const db = getNativeDb();
            if (db) {
              // Try to convert to ObjectId if it's a valid format
              let userObjectId;
              try {
                // Handle ObjectId string format like "ObjectId("hex")"
                if (typeof uploaderId === 'string' && uploaderId.includes('ObjectId(')) {
                  const matches = uploaderId.match(/ObjectId\("([0-9a-f]{24})"\)/);
                  if (matches && matches[1]) {
                    userObjectId = new mongoose.Types.ObjectId(matches[1]);
                  }
                } else {
                  userObjectId = new mongoose.Types.ObjectId(uploaderId);
                }
              } catch (idError) {
                console.error(`Invalid ObjectId format: ${uploaderId}`, idError);
                userObjectId = null;
              }
              
              let userData = null;
              
              // Try to find in users collection
              if (userObjectId) {
                userData = await db.collection('users').findOne({ _id: userObjectId });
                if (userData) {
                  console.log(`Found user in users collection: ${userData.firstName} ${userData.lastName}`);
                }
              }
              
              // If not found in users, try personnels collection
              if (!userData && userObjectId) {
                userData = await db.collection('personnels').findOne({ _id: userObjectId });
                if (userData) {
                  console.log(`Found user in personnels collection: ${userData.firstName} ${userData.lastName}`);
                }
              }
              
              // Update the document with user data if found
              if (userData) {
                doc.uploadedBy = {
                  _id: uploaderId,
                  firstName: userData.firstName || 'Unknown',
                  lastName: userData.lastName || 'User',
                  serviceId: userData.serviceNumber || userData.serviceId || 'N/A',
                  company: userData.company || '',
                  rank: userData.rank || ''
                };
              } else {
                // Default values if user not found
                doc.uploadedBy = {
                  _id: uploaderId,
                  firstName: 'Unknown',
                  lastName: 'User',
                  serviceId: 'N/A',
                  company: '',
                  rank: ''
                };
              }
            }
          } catch (lookupError) {
            console.error('Error looking up user:', lookupError);
            // Default values if lookup fails
            doc.uploadedBy = {
              _id: uploaderId,
              firstName: 'Unknown',
              lastName: 'User',
              serviceId: 'N/A',
              company: '',
              rank: ''
            };
          }
        }
      }
    } catch (error: any) {
      console.error('Error querying documents:', error);
      return NextResponse.json(
        { success: false, error: 'Error querying documents: ' + error.message },
        { status: 500 }
      );
    }
    
    // Process documents to ensure consistent format and handle mobile uploads
    const processedDocuments = documents.map(doc => {
      try {
        // Format dates - include all possible date fields
        const dateOptions = {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        };
        
        // Make sure we have an uploadDate
        if (doc.uploadDate) {
          doc.uploadDate = new Date(doc.uploadDate).toLocaleString('en-US', dateOptions);
        } else if (doc.createdAt) {
          doc.uploadDate = new Date(doc.createdAt).toLocaleString('en-US', dateOptions);
        } else if (doc.uploadedAt) {
          doc.uploadDate = new Date(doc.uploadedAt).toLocaleString('en-US', dateOptions);
        } else {
          doc.uploadDate = new Date().toLocaleString('en-US', dateOptions);
        }
        
        // Format verification date if available
        if (doc.verifiedDate) {
          doc.verifiedDate = new Date(doc.verifiedDate).toLocaleString('en-US', dateOptions);
        }
        
        // Handle document name
        if (!doc.name && doc.title) {
          doc.name = doc.title;
        }
        
        // Handle uploader info for mobile uploads
        if (doc.uploadedBy) {
          const uploader = doc.uploadedBy;
          
          // For mobile uploads, title might be used instead of firstName
          if ((uploader as any).title && !(uploader as any).firstName) {
            (uploader as any).firstName = (uploader as any).title;
          }
          
          // If we have a name field but no firstName (from mobile app), use it
          if ((uploader as any).name && !(uploader as any).firstName) {
            const fullName = (uploader as any).name.split(' ');
            if (fullName.length > 1) {
              (uploader as any).firstName = fullName[0];
              (uploader as any).lastName = fullName.slice(1).join(' ');
            } else {
              (uploader as any).firstName = fullName[0];
              (uploader as any).lastName = '';
            }
          }
          
          // If we have a serviceNumber but no serviceId, use it
          if ((uploader as any).serviceNumber && !(uploader as any).serviceId) {
            (uploader as any).serviceId = (uploader as any).serviceNumber;
          }
          
          // Make sure rank is included
          if (!(uploader as any).rank) {
            (uploader as any).rank = '';
          }
          
          // Make sure company is included
          if (!(uploader as any).company) {
            (uploader as any).company = '';
          }
          
          // Ensure we have at least placeholder values for required fields
          if (!(uploader as any).firstName) (uploader as any).firstName = 'Unknown';
          if (!(uploader as any).lastName) (uploader as any).lastName = 'User';
          if (!(uploader as any).serviceId) (uploader as any).serviceId = 'N/A';
        } else {
          // Provide default uploader info if missing
          doc.uploadedBy = {
            firstName: 'Unknown',
            lastName: 'User',
            serviceId: 'N/A',
            company: '',
            rank: ''
          };
        }
        
        return doc;
      } catch (error) {
        console.error(`Error processing document ${doc._id}:`, error);
        return doc;
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        documents: processedDocuments
      }
    });
    
  } catch (error: any) {
    console.error('Unhandled error in documents/list API:', error);
    return NextResponse.json(
      { success: false, error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}
