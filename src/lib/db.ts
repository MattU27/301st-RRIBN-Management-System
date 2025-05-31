import mongoose from 'mongoose';

// MongoDB connection string (should be stored in environment variables in production)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armed_forces_app';

// Track connection status
let isConnected = false;

/**
 * Connect to MongoDB with improved error handling
 */
export async function connectDB() {
  // If already connected, return
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...', MONGODB_URI);
    
    // Set strictQuery mode
    mongoose.set('strictQuery', true);
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true,
      connectTimeoutMS: 15000, // Give up initial connection after 15 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };
    
    // Check if MongoDB is running
    console.log('MongoDB connection options:', JSON.stringify(options));
    
    // Connect to MongoDB
    const db = await mongoose.connect(MONGODB_URI, options);
    
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected successfully. Connection state:', isConnected);
    console.log('Database name:', db.connections[0].name);
  } catch (error: any) {
    console.error('MongoDB connection error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
    });
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('Could not connect to any MongoDB servers. Make sure MongoDB is running.');
    } else if (error.name === 'MongooseError') {
      console.error('General Mongoose error. Check your connection string and database status.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Is MongoDB running on the specified host and port?');
    }
    
    isConnected = false;
    throw new Error(`Failed to connect to database: ${error.message}. Please check your MongoDB configuration.`);
  }
} 