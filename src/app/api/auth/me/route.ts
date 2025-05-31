import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// JWT secret key - should match the one in login route
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-signing';

export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      
      // Find user by id using direct collection access
      const userCollection = await mongoose.connection.collection('users');
      const user = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(decoded.userId) });
      
      // Check if user exists
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Return user data in the expected format
      return NextResponse.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status,
            rank: user.rank,
            company: user.company,
            profileImage: user.profileImage,
          }
        }
      });
    } catch (error) {
      // Token validation failed
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
} 