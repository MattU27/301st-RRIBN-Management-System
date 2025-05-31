import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Get MongoDB connection string from environment variables or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Path to the JSON database files for fallback
const JSON_DB_PATH = path.join(process.cwd(), 'afp_personnel_db');

// Define the type for the cached connection
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  useLocalFallback: boolean;
}

// Declare a global variable to cache the database connection
declare global {
  var mongoose: MongooseConnection;
}

// Initialize the global mongoose object if it doesn't exist
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null, useLocalFallback: false };
}

/**
 * Connect to MongoDB database with fallback to local JSON files
 */
export async function dbConnect() {
  // If we already have a connection, return it
  if (global.mongoose.conn) {
    return global.mongoose.conn;
  }

  // If we're already using local fallback, don't try to connect to MongoDB
  if (global.mongoose.useLocalFallback) {
    console.log('Using local JSON fallback (already established)');
    return global.mongoose.conn;
  }

  // If a connection is being established, wait for it
  if (!global.mongoose.promise) {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 5000, // 5 second timeout for connection
      serverSelectionTimeoutMS: 5000, // 5 second timeout for server selection
    };

    // Create a new connection promise
    global.mongoose.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB');
        global.mongoose.useLocalFallback = false;
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        console.log('Falling back to local JSON database files');
        
        // Set the fallback flag
        global.mongoose.useLocalFallback = true;
        
        // Setup a minimal mongoose instance for compatibility
        // This won't actually connect to MongoDB but provides the same interface
        return mongoose;
      });
  }

  try {
    // Wait for the connection to be established
    global.mongoose.conn = await global.mongoose.promise;
    return global.mongoose.conn;
  } catch (error) {
    console.error('Error finalizing database connection:', error);
    global.mongoose.useLocalFallback = true;
    return mongoose; // Return mongoose instance anyway for API compatibility
  }
}

/**
 * Check if we're using the local JSON fallback
 */
export function isUsingLocalFallback() {
  return global.mongoose?.useLocalFallback || false;
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