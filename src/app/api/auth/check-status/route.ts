import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { UserStatus } from '@/types/auth';

interface UserDocument {
  _id: string;
  status: UserStatus;
  email: string;
  alternativeEmail?: string;
  [key: string]: any;
}

export async function POST(request: Request) {
  try {
    // Connect to MongoDB using only one connection method
    try {
      await connectDB();
      console.log('Connected to database via connectDB');
    } catch (e) {
      console.error('Database connection failed:', e);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Get email from request body
    const body = await request.json().catch(() => ({}));
    const { email } = body;
    
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