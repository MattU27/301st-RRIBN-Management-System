
// Stub file for mongodb connection
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

export async function connectToDatabase() {
  try {
    return await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    return null;
  }
}

export default { connectToDatabase };
