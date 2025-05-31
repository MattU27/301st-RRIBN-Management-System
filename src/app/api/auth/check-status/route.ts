import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { UserStatus } from '@/types/auth';

interface UserDocument {
  _id: string;
  status: UserStatus;
  [key: string]: any;
}

export async function POST(request: Request) {
  try {
    // Connect to MongoDB - try both connection methods to ensure we're connected
    try {
      await connectDB();
      console.log('Connected to database via connectDB');
    } catch (e) {
      console.log('Failed to connect via connectDB, trying dbConnect...');
      await dbConnect();
      console.log('Connected to database via dbConnect');
    }
    
    // Get email from request body
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`Checking status for email: ${email}`);
    
    // Find user by either primary email or alternative email
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { alternativeEmail: email.toLowerCase() }
      ]
    })
      .select('status email alternativeEmail')
      .lean() as UserDocument | null;
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      // For security reasons, don't reveal that the user doesn't exist
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log(`Found user with status: ${user.status}`);
    
    // Return user status
    return NextResponse.json({
      success: true,
      user: {
        status: user.status,
        // Include which email matched for debugging
        matchedEmail: user.email.toLowerCase() === email.toLowerCase() ? 'primary' : 'alternative'
      }
    });
  } catch (error: any) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while checking user status' },
      { status: 500 }
    );
  }
} 