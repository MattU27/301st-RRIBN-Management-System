import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import AuditLog from '@/models/AuditLog';

// JWT secret key - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-signing';

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
    
    // Get login credentials from request body
    const { email, password } = await request.json();
    
    console.log(`Login attempt for: ${email}`);
    
    // Validate email and password
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user with mongoose model - explicitly select password
    console.log('Finding user via mongoose model...');
    let user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { alternativeEmail: email.toLowerCase() }
      ]
    }).select('+password');
    
    // Fallback to direct collection query if mongoose model fails
    if (!user) {
      console.log('User not found via mongoose, trying direct collection access...');
      const userCollection = await mongoose.connection.collection('users');
      const rawUser = await userCollection.findOne({
        $or: [
          { email: email.toLowerCase() },
          { alternativeEmail: email.toLowerCase() }
        ]
      });
      
      if (rawUser) {
        console.log('User found via direct collection access');
        // Convert to mongoose model if found directly
        user = await User.hydrate(rawUser);
      } else {
        console.log(`User not found with email: ${email}`);
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    console.log(`User found: ${email}`);
    console.log('User details:', { 
      id: user._id, 
      email: user.email,
      alternativeEmail: user.alternativeEmail,
      usedEmail: user.email.toLowerCase() === email.toLowerCase() ? 'primary' : 'alternative',
      passwordExists: !!user.password,
      passwordStartsWith: user.password ? user.password.substring(0, 10) : 'none',
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Check if user is deactivated
    if (user.status === 'deactivated' || user.status === 'inactive') {
      console.log(`Attempt to login to deactivated account: ${email}`);
      return NextResponse.json(
        { success: false, error: 'This account has been deactivated. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Compare password - use the User model method if available
    try {
      console.log('Comparing password...');
      let isPasswordValid;
      
      // Try using the User model's comparePassword method
      if (typeof user.comparePassword === 'function') {
        console.log('Using User.comparePassword method');
        isPasswordValid = await user.comparePassword(password);
      } else {
        // Fallback to direct bcrypt comparison
        console.log('Using direct bcrypt.compare');
        isPasswordValid = await bcrypt.compare(password, user.password);
      }
      
      console.log('Password comparison result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log(`Invalid password for user: ${email}`);
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    } catch (passwordError) {
      console.error('Error during password comparison:', passwordError);
      return NextResponse.json(
        { success: false, error: 'Error validating credentials' },
        { status: 500 }
      );
    }
    
    // Update last login date
    user.lastLogin = new Date();
    await user.save();
    
    // Create user object without password
    const userWithoutPassword = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      rank: user.rank,
      company: user.company,
      profileImage: user.profileImage,
    };
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    console.log(`Login successful for user: ${email}, role: ${user.role}`);
    
    // Log the successful login to the audit log
    try {
      const auditLog = new AuditLog({
        timestamp: new Date(),
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
        action: 'login',
        resource: 'user',
        details: 'User login successful',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      await auditLog.save();
      console.log('Login event logged to audit system');
    } catch (auditError) {
      // Don't fail the login if audit logging fails
      console.error('Error logging to audit system:', auditError);
    }
    
    // Create response with token and user data
    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    });
    
    // Set the token as an HTTP-only cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: '/',
      sameSite: 'strict',
    });
    
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Return more detailed error information
    const status = error.status || 500;
    const errorDetails = {
      success: false, 
      error: error.message || 'Login failed',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    };
    
    console.error('Responding with error:', errorDetails);
    
    return NextResponse.json(errorDetails, { status });
  }
} 