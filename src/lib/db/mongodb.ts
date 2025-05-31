import mongoose from 'mongoose';

// Import models to ensure they are registered before any usage
import '@/models/User';
import '@/models/Announcement';

// Connection strings
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Global variable to maintain connection status
declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: {
    promise: Promise<typeof mongoose> | null;
    conn: typeof mongoose | null;
  };
}

// Initialize the global connection variables
if (!global.mongooseConnection) {
  global.mongooseConnection = {
    conn: null,
    promise: null,
  };
}

/**
 * Connect to MongoDB and return the connection
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // If we already have a connection, reuse it
  if (global.mongooseConnection.conn) {
    return global.mongooseConnection.conn;
  }

  // If a connection is being established, return the promise
  if (!global.mongooseConnection.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Create a new connection promise
    global.mongooseConnection.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB');
        return mongoose;
      });
  }

  try {
    // Wait for the connection to be established
    global.mongooseConnection.conn = await global.mongooseConnection.promise;
    return global.mongooseConnection.conn;
  } catch (error) {
    // If connection fails, reset the promise so we can try again
    global.mongooseConnection.promise = null;
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (global.mongooseConnection.conn) {
    await mongoose.disconnect();
    global.mongooseConnection.conn = null;
    global.mongooseConnection.promise = null;
    console.log('Disconnected from MongoDB');
  }
}

export default { connectToDatabase, disconnectFromDatabase }; 