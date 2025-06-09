import mongoose from 'mongoose';
import { Db } from 'mongodb';

// Define the type for our cached connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  db: Db | null;
}

// Add type declaration for global mongoose cache
declare global {
  var mongoose: MongooseCache;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

let cached: MongooseCache = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, db: null };
}

export async function connectToDatabase() {
  if (cached.conn && cached.db) {
    console.log('Using cached database connection');
    return { conn: cached.conn, db: cached.db };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Connecting to MongoDB:', MONGODB_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://****:****@'));
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    
    // Get the database instance
    if (mongoose.connection.readyState === 1) {
      cached.db = mongoose.connection.db as unknown as Db;
      if (cached.db) {
        console.log('Successfully connected to MongoDB database:', cached.db.databaseName);
      } else {
        console.error('MongoDB connection db is null');
        throw new Error('MongoDB connection db is null');
      }
    } else {
      console.error('MongoDB connection not ready, readyState:', mongoose.connection.readyState);
      throw new Error('MongoDB connection not ready');
    }
  } catch (e) {
    cached.promise = null;
    cached.db = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return { conn: cached.conn, db: cached.db };
} 