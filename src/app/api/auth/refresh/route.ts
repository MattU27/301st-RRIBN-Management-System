import { NextResponse } from 'next/server';
import { verifyJWT, generateJWT } from '@/utils/auth';
import User from '@/models/User';
import { dbConnect } from '@/utils/dbConnect';

/**
 * POST handler to refresh a JWT token
 */
export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Verify that the user still exists and has the same role
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }
    
    // Generate a new token with the same information but a fresh expiry
    const newToken = generateJWT(decoded.userId, user.role, user.email);
    
    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error refreshing token' },
      { status: 500 }
    );
  }
} 