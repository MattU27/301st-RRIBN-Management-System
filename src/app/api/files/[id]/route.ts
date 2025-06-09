import { NextResponse } from 'next/server';
import { ensureDbConnection } from '@/utils/dbConnect';
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
    
    // Check if this is a download request
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';
    
    console.log(`File API request for ID ${fileId}, download: ${isDownload}`);
    
    if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID', details: 'The provided ID is not a valid MongoDB ObjectId' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB with retry logic
    let connectionAttempts = 0;
    const maxConnectionAttempts = 3;
    let db = null;
    
    while (connectionAttempts < maxConnectionAttempts && !db) {
      connectionAttempts++;
      console.log(`DB connection attempt ${connectionAttempts} of ${maxConnectionAttempts}`);
      
      try {
        db = await ensureDbConnection();
        if (db) {
          console.log(`Successfully connected to database: ${db.databaseName}`);
          break;
        } else {
          console.error('Database connection returned null');
          if (connectionAttempts < maxConnectionAttempts) {
            console.log(`Retrying connection in 1 second...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error(`Error connecting to database (attempt ${connectionAttempts}):`, error);
        if (connectionAttempts < maxConnectionAttempts) {
          console.log(`Retrying connection in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!db) {
      console.error('Failed to connect to database after multiple attempts');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed', 
          details: 'Could not connect to database after multiple attempts',
          database: 'afp_personnel_db'
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Initialize GridFS
    let gridFSBucket;
    try {
      gridFSBucket = new GridFSBucket(db);
    } catch (error) {
      console.error('Failed to initialize GridFS bucket:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to initialize GridFS', 
          details: error instanceof Error ? error.message : 'Unknown GridFS initialization error'
        },
        { status: 500 }
      );
    }
    
    // Check if the file exists
    const files = await db.collection('fs.files').findOne({
      _id: new mongoose.Types.ObjectId(fileId)
    });
    
    if (!files) {
      console.error(`File with ID ${fileId} not found in GridFS`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'File not found', 
          details: `No file found with ID ${fileId} in GridFS`,
          database: 'afp_personnel_db'
        },
        { status: 404 }
      );
    }
    
    // Get file metadata
    const filename = files.filename || 'download';
    const contentType = files.contentType || 'application/octet-stream';
    
    console.log(`Found file in GridFS: ${filename}, type: ${contentType}, size: ${files.length} bytes`);
    
    try {
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
          'Content-Disposition': isDownload 
            ? `attachment; filename="${filename}"` 
            : `inline; filename="${filename}"`,
          'Cache-Control': 'public, max-age=3600'
        },
      });
    } catch (error) {
      console.error(`Error streaming file ${fileId} from GridFS:`, error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error streaming file', 
          details: error instanceof Error ? error.message : 'Failed to stream file from GridFS',
          database: 'afp_personnel_db'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error retrieving file:', error);
    
    // Determine the type of error for better client feedback
    let errorMessage = error.message || 'Error retrieving file';
    let statusCode = 500;
    
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      errorMessage = 'Database connection failed';
      statusCode = 503; // Service Unavailable
    } else if (error.name === 'MongoError' && error.code === 11000) {
      errorMessage = 'Database query error';
      statusCode = 500;
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Database connection refused';
      statusCode = 503; // Service Unavailable
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error.stack ? error.stack.split('\n')[0] : 'Unknown error',
        database: 'afp_personnel_db',
        errorType: error.name || 'Unknown'
      },
      { status: statusCode }
    );
  }
} 