import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { MilitaryRank, Company } from '@/models/User';

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-jwt-signing';

export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing or invalid header' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Empty token in authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Empty token' },
        { status: 401 }
      );
    }
    
    console.log('Processing token for GET profile:', token.substring(0, 10) + '...');
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      console.log('Token verified, userId:', decoded.userId);
      
      // Find user by id
      const user = await User.findById(decoded.userId);
      
      // Check if user exists
      if (!user) {
        console.log('User not found for id:', decoded.userId);
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.log('Profile retrieved successfully for user:', user.email);
      
      // Return full user profile
      return NextResponse.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            alternativeEmail: user.alternativeEmail,
            role: user.role,
            status: user.status,
            rank: user.rank,
            company: user.company,
            militaryId: user.militaryId,
            profileImage: user.profileImage,
            contactNumber: user.contactNumber,
            dateOfBirth: user.dateOfBirth,
            address: user.address,
            emergencyContact: user.emergencyContact,
          }
        }
      });
    } catch (error: any) {
      // Token validation failed
      console.error('Token verification failed:', error.message);
      return NextResponse.json(
        { success: false, error: `Invalid token: ${error.message}` },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Profile retrieval error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header for profile update');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing or invalid header' },
        { status: 401 }
      );
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Empty token in authorization header for profile update');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Empty token' },
        { status: 401 }
      );
    }
    
    console.log('Processing token for PUT profile:', token.substring(0, 10) + '...');
    
    // Get update data
    const updateData = await request.json();
    console.log('Update data received:', JSON.stringify(updateData).substring(0, 100) + '...');
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      console.log('Token verified for update, userId:', decoded.userId);
      
      // Find user by id
      const user = await User.findById(decoded.userId);
      
      // Check if user exists
      if (!user) {
        console.log('User not found for profile update, id:', decoded.userId);
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Update allowed fields only
      const allowedFields = [
        'firstName', 
        'lastName', 
        'contactNumber',
        'alternativeEmail',
        'address',
        'emergencyContact',
        'rank',
        'company'
      ];
      
      // Create update object with only allowed fields
      const updateObj: any = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          // Handle empty ranks - don't update if empty
          if (field === 'rank' && (!updateData[field] || updateData[field] === '')) {
            console.log('Skipping empty rank field');
            continue;
          }
          updateObj[field] = updateData[field];
        }
      }
      
      // Check if rank is valid when provided
      if (updateObj.rank) {
        // Validate the rank is an allowed value
        const validRanks = Object.values(MilitaryRank);
        if (!validRanks.includes(updateObj.rank)) {
          console.log(`Invalid rank value: "${updateObj.rank}"`);
          return NextResponse.json(
            { success: false, error: `Invalid rank. Must be one of: ${validRanks.join(', ')}` },
            { status: 400 }
          );
        }
      }
      
      // Check if company is valid when provided
      if (updateObj.company) {
        // Validate the company is an allowed value
        const validCompanies = Object.values(Company);
        if (!validCompanies.includes(updateObj.company)) {
          console.log(`Invalid company value: "${updateObj.company}"`);
          return NextResponse.json(
            { success: false, error: `Invalid company. Must be one of: ${validCompanies.join(', ')}` },
            { status: 400 }
          );
        }
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: updateObj },
        { new: true, runValidators: true }
      );
      
      console.log('Profile updated successfully for user:', updatedUser.email);
      
      // Return updated user
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            alternativeEmail: updatedUser.alternativeEmail,
            role: updatedUser.role,
            status: updatedUser.status,
            rank: updatedUser.rank,
            company: updatedUser.company,
            contactNumber: updatedUser.contactNumber,
            address: updatedUser.address,
            emergencyContact: updatedUser.emergencyContact,
          }
        }
      });
    } catch (error: any) {
      // Handle validation errors specifically
      if (error.name === 'ValidationError') {
        console.error('Validation error:', error.message);
        return NextResponse.json(
          { success: false, error: `Validation failed: ${error.message}` },
          { status: 400 }
        );
      }
      
      // Token validation failed
      console.error('Token verification failed for profile update:', error.message);
      return NextResponse.json(
        { success: false, error: `Invalid token: ${error.message}` },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
} 