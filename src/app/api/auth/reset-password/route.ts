import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Token, { TokenType } from '@/models/Token';
import bcrypt from 'bcryptjs';
import { handleAPIError } from '@/middleware';
import mongoose from 'mongoose';

// Password validation requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIRES_UPPERCASE = true;
const PASSWORD_REQUIRES_LOWERCASE = true;
const PASSWORD_REQUIRES_NUMBER = true;
const PASSWORD_REQUIRES_SYMBOL = true;

/**
 * Check if password meets complexity requirements
 */
function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
  }
  
  if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (PASSWORD_REQUIRES_NUMBER && !/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  if (PASSWORD_REQUIRES_SYMBOL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!, @, #, $, etc.)' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * API endpoint for resetting a password with a token
 * POST /api/auth/reset-password
 */
export async function POST(req: NextRequest) {
  console.log('Reset password POST request received');
  try {
    await connectDB();
    console.log('Connected to database');

    const { token, newPassword, confirmPassword } = await req.json();
    console.log('Reset password request data received', { token: token?.substring(0, 10) + '...' });

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      console.log('Missing required fields');
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      console.log('Passwords do not match');
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validationResult = validatePasswordStrength(newPassword);
    if (!validationResult.isValid) {
      console.log('Password does not meet requirements:', validationResult.message);
      return NextResponse.json(
        { success: false, message: validationResult.message },
        { status: 400 }
      );
    }

    // Look up token and find user
    console.log('Looking up reset token:', token?.substring(0, 10) + '...');
    const resetToken = await Token.findOne({
      token,
      type: TokenType.PASSWORD_RESET,
    });

    if (!resetToken) {
      console.log('Invalid or expired token');
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token. Please request a new reset link.' },
        { status: 400 }
      );
    }

    console.log('Token found, retrieving user with ID:', resetToken.userId);
    
    // Make sure we get the full user with password and passwordHistory fields
    const user = await User.findById(resetToken.userId).select('+password +passwordHistory');
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if new password is same as old password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      console.log('New password cannot be the same as old password');
      return NextResponse.json(
        { success: false, message: 'New password cannot be the same as your current password. Please choose a different password.' },
        { status: 400 }
      );
    }

    // Check if password is in history
    const isInHistory = await user.isPasswordInHistory(newPassword);
    if (isInHistory) {
      console.log('Password has been used before');
      return NextResponse.json(
        { success: false, message: 'This password has been used before. Please choose a different password.' },
        { status: 400 }
      );
    }

    // Update user's password
    console.log('Updating password for user');
    user.password = newPassword;
    await user.save();

    // Delete token after use
    console.log('Deleting used reset token');
    await Token.deleteOne({ _id: resetToken._id });

    console.log('Password reset successful');
    return NextResponse.json(
      { success: true, message: 'Password has been reset successfully. You can now log in with your new password.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password. Please try again later.' },
      { status: 500 }
    );
  }
}

// Add a custom error handler for this route
export const GET = POST;
export const PUT = POST; 