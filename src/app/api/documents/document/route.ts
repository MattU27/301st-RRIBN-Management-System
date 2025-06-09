import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import { ensureDbConnection } from '@/utils/dbConnect';
import { ObjectId, GridFSBucket } from 'mongodb';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum execution time to 60 seconds

export async function GET(request: NextRequest) {
  try {
    console.log('Document API route called');
    
    // Get document ID from query parameters
    const url = new URL(request.url);
    const documentId = url.searchParams.get('id');
    const downloadParam = url.searchParams.get('download');
    const isDownload = downloadParam === 'true';
    
    console.log('Request parameters:', { documentId, isDownload });
    
    // Validate document ID
    if (!documentId) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }
    
    // Verify authentication
    let token = request.headers.get('authorization')?.split(' ')[1];
    
    // If no token in header, check query parameter
    if (!token) {
      const queryToken = url.searchParams.get('token');
      if (queryToken) {
        token = queryToken;
      }
    }
    
    // If still no token, check cookies
    if (!token) {
      token = request.cookies.get('token')?.value;
    }
    
    if (!token) {
      console.log('No authorization token provided');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    
    const decodedToken = await validateToken(token);
    if (!decodedToken) {
      console.log('Invalid token');
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('Token validated, user:', decodedToken.userId);
    
    // Connect to MongoDB with retry logic
    console.log('Connecting to MongoDB for document download');
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
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed', 
        details: 'Could not connect to database after multiple attempts',
        database: 'afp_personnel_db'
      }, { status: 503 });
    }
    
    // Initialize GridFS bucket
    let bucket;
    try {
      if (!db) {
        throw new Error('Database object is null');
      }
      bucket = new GridFSBucket(db);
      console.log('GridFS bucket initialized');
    } catch (error) {
      console.error('Error initializing GridFS bucket:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to initialize GridFS', 
        details: error instanceof Error ? error.message : 'Unknown GridFS error'
      }, { status: 500 });
    }
    
    // Find the document to get file information
    const documentsCollection = db.collection('documents');
    
    // Try to find document by ObjectId
    let document;
    try {
      // Try to convert to ObjectId first
      const objectId = new ObjectId(documentId);
      document = await documentsCollection.findOne({ _id: objectId });
      console.log('Searched for document by ObjectId');
    } catch (error) {
      // If ObjectId conversion fails, try as string ID
      console.log('ObjectId conversion failed, trying string ID');
      try {
        document = await documentsCollection.findOne({ _id: documentId as any });
      } catch (dbError) {
        console.error('Error querying documents collection:', dbError);
        return NextResponse.json({ 
          success: false, 
          error: 'Database query error', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }
    
    // If document not found, try to find the file directly in GridFS
    if (!document) {
      console.log('Document not found, trying to access GridFS file directly with ID:', documentId);
      
      try {
        // Try to find the file directly in GridFS
        const fileObjectId = new ObjectId(documentId);
        const filesCollection = db.collection('fs.files');
        const fileInfo = await filesCollection.findOne({ _id: fileObjectId });
        
        if (fileInfo) {
          console.log('Found GridFS file directly:', fileInfo.filename);
          
          // Create a stream to read the file from GridFS
          const downloadStream = bucket.openDownloadStream(fileObjectId);
          
          // Collect chunks in a buffer
          const chunks: Buffer[] = [];
          
          // Return a Promise that resolves with the file data
          const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
            downloadStream.on('data', (chunk) => {
              chunks.push(Buffer.from(chunk));
            });
            
            downloadStream.on('error', (err) => {
              console.error('Error downloading file from GridFS:', err);
              reject(err);
            });
            
            downloadStream.on('end', () => {
              console.log('File download from GridFS completed');
              resolve(Buffer.concat(chunks));
            });
          });
          
          // Determine content type
          let contentType = fileInfo.contentType || 'application/octet-stream';
          if (fileInfo.filename.toLowerCase().endsWith('.pdf')) {
            contentType = 'application/pdf';
          } else if (fileInfo.filename.toLowerCase().endsWith('.jpg') || fileInfo.filename.toLowerCase().endsWith('.jpeg')) {
            contentType = 'image/jpeg';
          } else if (fileInfo.filename.toLowerCase().endsWith('.png')) {
            contentType = 'image/png';
          }
          
          // Set appropriate headers based on whether it's a download or inline view
          const disposition = isDownload ? 'attachment' : 'inline';
          
          // Return file as response
          return new Response(new Uint8Array(fileBuffer), {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `${disposition}; filename="${fileInfo.filename}"`,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch (error) {
        console.error('Error accessing GridFS file directly:', error);
      }
      
      console.log('Document not found');
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    
    console.log('Document found:', { id: document._id, name: document.name || document.title });
    
    // Check if document has fileId or gridFSId
    const fileId = document.fileId || document.gridFSId;
    
    if (!fileId) {
      console.log('Document has no fileId or gridFSId');
      return NextResponse.json({ success: false, error: 'Document has no associated file' }, { status: 404 });
    }
    
    console.log('Found document with fileId:', fileId);
    
    // Find the file in GridFS
    let fileObjectId;
    try {
      fileObjectId = new ObjectId(fileId);
      console.log('Created ObjectId for fileId:', fileId);
    } catch (e) {
      console.log('Invalid file ID format:', fileId, e);
      return NextResponse.json({ success: false, error: 'Invalid file ID format' }, { status: 400 });
    }
    
    // Get file metadata
    const filesCollection = db.collection('fs.files');
    let fileInfo = await filesCollection.findOne({ _id: fileObjectId });
    
    if (!fileInfo) {
      console.log('File not found in GridFS with ID:', fileId);
      
      // Try to find the file by filename as a fallback
      const fileByFilename = await filesCollection.findOne({ filename: fileId });
      if (fileByFilename) {
        console.log('Found file by filename instead:', fileByFilename._id);
        fileObjectId = fileByFilename._id;
        fileInfo = fileByFilename;
      } else {
        return NextResponse.json({ success: false, error: 'File not found in storage' }, { status: 404 });
      }
    }
    
    console.log('File found in GridFS:', { 
      filename: fileInfo.filename, 
      contentType: fileInfo.contentType,
      size: fileInfo.length
    });
    
    // Create a stream to read the file from GridFS
    const downloadStream = bucket.openDownloadStream(fileObjectId);
    
    // Collect chunks in a buffer
    const chunks: Buffer[] = [];
    
    // Return a Promise that resolves with the file data
    const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      
      downloadStream.on('error', (err) => {
        console.error('Error downloading file from GridFS:', err);
        reject(err);
      });
      
      downloadStream.on('end', () => {
        console.log('File download from GridFS completed');
        resolve(Buffer.concat(chunks));
      });
    });
    
    // Determine content type
    let contentType = fileInfo.contentType || 'application/octet-stream';
    if (fileInfo.filename.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (fileInfo.filename.toLowerCase().endsWith('.jpg') || fileInfo.filename.toLowerCase().endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (fileInfo.filename.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    }
    
    // Set appropriate headers based on whether it's a download or inline view
    const disposition = isDownload ? 'attachment' : 'inline';
    
    // Return file as response
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${fileInfo.filename}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error retrieving document:', error);
    
    // Determine the type of error for better client feedback
    let errorMessage = 'Failed to retrieve document';
    let statusCode = 500;
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof Error) {
      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
        errorMessage = 'Database connection failed';
        statusCode = 503; // Service Unavailable
      } else if (error.name === 'MongoError' && (error as any).code === 11000) {
        errorMessage = 'Database query error';
        statusCode = 500;
      } else if (error.message && error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Database connection refused';
        statusCode = 503; // Service Unavailable
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: errorDetails,
      database: 'afp_personnel_db',
      errorType: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.split('\n')[0] : undefined
    }, { status: statusCode });
  }
} 