import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Document from '@/models/Document';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

/**
 * GET handler to clean up documents with John Matthew Banto's ID
 */
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    console.log('Connected to database for document cleanup');
    
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
    
    // Only allow admins to run this operation
    if (decoded.role !== 'admin' && decoded.role !== 'director' && decoded.role !== 'staff') {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    console.log('Starting document cleanup process...');
    
    // Find all documents with John Matthew Banto's ID
    const johnBantoId = '68063c32bb93f9ffb2000000';
    
    // Find documents with John Matthew Banto's ID
    const documents = await Document.find({
      $or: [
        { userId: johnBantoId },
        { uploadedBy: johnBantoId }
      ]
    });
    
    console.log(`Found ${documents.length} documents with John Matthew Banto's ID`);
    
    // Update these documents to use the current user's ID
    let updatedCount = 0;
    
    for (const doc of documents) {
      console.log(`Cleaning document ${doc._id}...`);
      
      // Try to find the actual owner based on the document's metadata
      let actualOwnerId = decoded.userId; // Default to current user
      
      try {
        // If the document has a title or other metadata, try to find the actual owner
        const Personnel = mongoose.model('Personnel');
        
        // Look for a personnel record with matching email domain or service number pattern
        // This is just an example - adjust based on your actual data structure
        if (doc.fileName && doc.fileName.includes('@')) {
          const emailPart = doc.fileName.split('@')[1];
          const possibleOwner = await Personnel.findOne({ email: { $regex: emailPart } }).lean();
          
          if (possibleOwner) {
            actualOwnerId = possibleOwner._id;
            console.log(`Found likely owner ${possibleOwner.firstName} ${possibleOwner.lastName} for document ${doc._id}`);
          }
        }
      } catch (err) {
        console.log(`Error finding actual owner: ${err}`);
      }
      
      // Update the document with the determined owner ID
      await Document.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            userId: actualOwnerId,
            uploadedBy: actualOwnerId
          } 
        }
      );
      
      updatedCount++;
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${updatedCount} documents`,
      data: {
        totalFound: documents.length,
        updated: updatedCount
      }
    });
    
  } catch (error: any) {
    console.error('Error cleaning documents:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error cleaning documents' },
      { status: 500 }
    );
  }
} 