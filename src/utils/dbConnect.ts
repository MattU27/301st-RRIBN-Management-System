import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Db } from 'mongodb';

// Get MongoDB connection string from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Path to the JSON database files for fallback
const JSON_DB_PATH = path.join(process.cwd(), 'afp_personnel_db');

// Define the type for the cached connection
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  useLocalFallback: boolean;
  nativeDb: Db | null;
}

// Global cached connection
let cachedConnection: MongooseConnection = {
  conn: null,
  promise: null,
  useLocalFallback: false,
  nativeDb: null
};

// Display connection string (hiding credentials for security)
function getRedactedConnectionString(uri: string): string {
  try {
    // For URI with credentials
    if (uri.includes('@')) {
      const [protocol, rest] = uri.split('://');
      const [credentials, hostAndPath] = rest.split('@');
      return `${protocol}://*****:*****@${hostAndPath}`;
    }
    // For URI without credentials
    return uri;
  } catch (e) {
    return 'Invalid MongoDB URI';
  }
}

/**
 * Connect to MongoDB database
 */
export async function dbConnect(): Promise<typeof mongoose> {
  // If we already have a connection, return it
  if (cachedConnection.conn) {
    console.log('Using existing MongoDB connection');
    return cachedConnection.conn;
  }

  // If we're already trying to connect, return the promise
  if (cachedConnection.promise) {
    console.log('Waiting for existing MongoDB connection attempt to complete');
    try {
      cachedConnection.conn = await cachedConnection.promise;
      return cachedConnection.conn;
    } catch (error) {
      // If connection fails, reset the promise so we can try again
      cachedConnection.promise = null;
      console.error('MongoDB connection attempt failed:', error);
      throw error;
    }
  }

  console.log(`Connecting to MongoDB: ${getRedactedConnectionString(MONGODB_URI)}`);

  // Create a new connection promise
  cachedConnection.promise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Give up initial connection after 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  })
  .then(mongoose => {
    console.log('Connected to MongoDB successfully!');
    // Check if connection and db exist before accessing properties
    if (mongoose.connection && mongoose.connection.db) {
      console.log(`Database name: ${mongoose.connection.db.databaseName}`);
      
      // Store native MongoDB driver connection for GridFS operations
      cachedConnection.nativeDb = mongoose.connection.db as unknown as Db;
    }
    console.log(`Connection state: ${mongoose.connection.readyState}`);
    return mongoose;
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
    
    // Set fallback flag if MongoDB connection fails
    cachedConnection.useLocalFallback = true;
    
    // Handle different types of connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.warn('Failed to connect to MongoDB. Check your connection string and network connectivity.');
    }
    
    // Re-throw the error
    throw error;
  });

  try {
    // Wait for the connection to be established
    cachedConnection.conn = await cachedConnection.promise;
    return cachedConnection.conn;
  } catch (error) {
    // If connection fails, reset the promise so we can try again
    cachedConnection.promise = null;
    throw error;
  }
}

/**
 * Get the native MongoDB driver Db instance
 * Useful for GridFS operations
 */
export function getNativeDb(): Db | null {
  if (cachedConnection.nativeDb) {
    return cachedConnection.nativeDb;
  }
  
  if (cachedConnection.conn && mongoose.connection && mongoose.connection.db) {
    cachedConnection.nativeDb = mongoose.connection.db as unknown as Db;
    return cachedConnection.nativeDb;
  }
  
  return null;
}

/**
 * Check if we're using the local JSON fallback
 */
export function isUsingLocalFallback() {
  return cachedConnection?.useLocalFallback || false;
}

/**
 * Read data from local JSON file
 */
export async function readLocalJSONCollection(collectionName: string) {
  try {
    const filePath = path.join(JSON_DB_PATH, `afp_personnel_db.${collectionName}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`Error reading local JSON for ${collectionName}:`, error);
    return [];
  }
}

/**
 * Write data to local JSON file
 */
export async function writeLocalJSONCollection(collectionName: string, data: any[]) {
  try {
    const filePath = path.join(JSON_DB_PATH, `afp_personnel_db.${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing local JSON for ${collectionName}:`, error);
    return false;
  }
}

// Export the mongoose instance for use in models
export default mongoose; 