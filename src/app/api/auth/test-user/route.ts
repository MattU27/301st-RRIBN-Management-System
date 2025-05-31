import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@/types/auth';

export async function GET() {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'admin@test.com' });
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists',
        user: {
          email: existingUser.email,
          role: existingUser.role,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName
        }
      });
    }
    
    // Create password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    
    // Create test user
    const testUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      militaryId: 'TEST001',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await testUser.save();
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        email: testUser.email,
        role: testUser.role,
        firstName: testUser.firstName,
        lastName: testUser.lastName
      }
    });
  } catch (error: any) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create test user' },
      { status: 500 }
    );
  }
} 