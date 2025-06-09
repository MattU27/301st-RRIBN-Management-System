import { NextResponse } from 'next/server';
import { dbConnect, getNativeDb } from '@/utils/dbConnect';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import { Readable } from 'stream';

/**
 * Helper function to convert a GridFS stream to a ReadableStream
 */
function gridFSStreamToReadableStream(gridFSStream: any): ReadableStream {
  return new ReadableStream({
    start(controller) {
      gridFSStream.on('data', (chunk: any) => {
        controller.enqueue(chunk);
      });
      
      gridFSStream.on('end', () => {
        controller.close();
      });
      
      gridFSStream.on('error', (err: any) => {
        controller.error(err);
      });
    },
    cancel() {
      gridFSStream.destroy();
    }
  });
}

/**
 * GET handler to retrieve a file from GridFS by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get file ID from params
    const fileId = params.id;
    
    if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    await dbConnect();
    
    // Get the native MongoDB Db instance
    const db = getNativeDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Failed to connect to database' },
        { status: 500 }
      );
    }
    
    // Initialize GridFS
    const gridFSBucket = new GridFSBucket(db);
    
    // Check if the file exists
    const files = await db.collection('fs.files').findOne({
      _id: new mongoose.Types.ObjectId(fileId)
    });
    
    if (!files) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Get file metadata
    const filename = files.filename || 'download';
    const contentType = files.contentType || 'application/octet-stream';
    
    // Create a download stream
    const downloadStream = gridFSBucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );
    
    // Convert GridFS stream to ReadableStream
    const readableStream = gridFSStreamToReadableStream(downloadStream);
    
    // Return the file as a stream
    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error retrieving file:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Error retrieving file' },
      { status: 500 }
    );
  }
} 