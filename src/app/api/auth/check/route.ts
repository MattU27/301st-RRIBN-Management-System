import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get request headers and extract token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
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
    
    // Return user data
    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Authentication check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication check failed' },
      { status: 500 }
    );
  }
} 