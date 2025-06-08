import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { connectToDatabase } from './mongodb';

// Global variables to track GridFS buckets
let policyBucket: GridFSBucket | null = null;

/**
 * Initialize GridFS buckets for different file types
 */
export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (policyBucket) {
    return policyBucket;
  }

  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection not established');
    }
    
    // Create GridFS bucket for policies
    // Using any to bypass the module type conflicts
    policyBucket = new GridFSBucket(mongoose.connection.db as any, {
      bucketName: 'policyFiles'
    });
    
    console.log('GridFS bucket initialized for policy files');
    return policyBucket;
  } catch (error) {
    console.error('Error initializing GridFS bucket:', error);
    throw error;
  }
}

/**
 * Store a file in GridFS
 * @param fileBuffer The file buffer to store
 * @param filename The name to give the file
 * @param metadata Additional metadata to store with the file
 * @returns The ID of the stored file
 */
export async function storeFileInGridFS(
  fileBuffer: Buffer, 
  filename: string, 
  metadata: Record<string, any> = {}
): Promise<ObjectId> {
  const bucket = await getGridFSBucket();
  
  return new Promise((resolve, reject) => {
    // Create upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      metadata
    });
    
    // Listen for completion or error
    uploadStream.on('finish', function() {
      console.log(`File ${filename} stored in GridFS with id: ${uploadStream.id}`);
      resolve(uploadStream.id);
    });
    
    uploadStream.on('error', function(error) {
      console.error('Error storing file in GridFS:', error);
      reject(error);
    });
    
    // Write the buffer to the stream
    uploadStream.write(fileBuffer);
    uploadStream.end();
  });
}

/**
 * Get a file from GridFS as a buffer
 * @param fileId The ID of the file to retrieve
 * @returns A buffer containing the file data
 */
export async function getFileFromGridFS(fileId: ObjectId): Promise<Buffer> {
  const bucket = await getGridFSBucket();
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    // Create download stream
    const downloadStream = bucket.openDownloadStream(fileId);
    
    // Listen for data events
    downloadStream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    
    // Listen for completion
    downloadStream.on('end', () => {
      const fileBuffer = Buffer.concat(chunks);
      resolve(fileBuffer);
    });
    
    // Listen for errors
    downloadStream.on('error', (error) => {
      console.error('Error retrieving file from GridFS:', error);
      reject(error);
    });
  });
}

/**
 * Delete a file from GridFS
 * @param fileId The ID of the file to delete
 */
export async function deleteFileFromGridFS(fileId: ObjectId): Promise<void> {
  const bucket = await getGridFSBucket();
  
  return new Promise<void>((resolve, reject) => {
    // Using void promise-based API instead of callback
    bucket.delete(fileId)
      .then(() => {
        console.log(`File with ID ${fileId} deleted from GridFS`);
        resolve();
      })
      .catch((err) => {
        console.error('Error deleting file from GridFS:', err);
        reject(err);
      });
  });
}

/**
 * Get file metadata from GridFS
 * @param fileId The ID of the file to get metadata for
 * @returns The file metadata
 */
export async function getFileMetadata(fileId: ObjectId): Promise<any> {
  const bucket = await getGridFSBucket();
  
  return new Promise((resolve, reject) => {
    bucket.find({ _id: fileId }).toArray()
      .then(files => {
        if (!files || files.length === 0) {
          reject(new Error(`No file found with ID ${fileId}`));
        } else {
          resolve(files[0]);
        }
      })
      .catch(err => {
        console.error('Error getting file metadata from GridFS:', err);
        reject(err);
      });
  });
} 