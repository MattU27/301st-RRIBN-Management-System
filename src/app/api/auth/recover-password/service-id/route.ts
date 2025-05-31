import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Token, { TokenType } from '@/models/Token';
import { sendPasswordResetEmail } from '@/services/emailService';

/**
 * API endpoint for requesting a password reset using Service ID
 * POST /api/auth/recover-password/service-id
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to database
    try {
      await connectDB();
      console.log('Database connection successful');
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed. Please try again later.',
        details: process.env.NODE_ENV !== 'production' ? dbError.message : undefined
      }, { status: 500 });
    }
    
    // Get service ID from request body
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed successfully:', body);
    } catch (err) {
      console.error('Error parsing request body:', err);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request format. Please try again.' 
      }, { status: 400 });
    }
    
    const { serviceId } = body;
    
    if (!serviceId) {
      console.log('Missing service ID in request');
      return NextResponse.json({ 
        success: false, 
        error: 'Service ID is required' 
      }, { status: 400 });
    }
    
    console.log(`Password reset requested for Service ID: ${serviceId}`);
    
    // Find user by service ID
    let user;
    try {
      user = await User.findOne({ serviceId: serviceId.trim() });
      console.log(user ? `User found with Service ID ${serviceId}` : `No user found with Service ID ${serviceId}`);
    } catch (userError: any) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding user account. Please try again later.',
        details: process.env.NODE_ENV !== 'production' ? userError.message : undefined
      }, { status: 500 });
    }
    
    // For security reasons, always return the same response regardless of whether
    // the user was found or not to prevent enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent Service ID: ${serviceId}`);
      return NextResponse.json({ 
        success: true,
        message: 'If your Service ID is registered in our system, you will receive a password reset link at your registered email address.'
      });
    }
    
    // Make sure user has an email
    if (!user.email) {
      console.error(`User ${user._id} (Service ID: ${serviceId}) has no registered email`);
      return NextResponse.json({ 
        success: false, 
        error: 'No email address associated with this Service ID' 
      }, { status: 404 });
    }
    
    try {
      // Generate a password reset token
      console.log(`Attempting to generate token for user: ${user._id}`);
      let resetToken;
      try {
        resetToken = await Token.generatePasswordResetToken(user._id);
        console.log(`Token generated successfully for user ${user._id}`);
      } catch (tokenError: any) {
        console.error('Error generating token:', tokenError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error generating reset token. Please try again later.',
          details: process.env.NODE_ENV !== 'production' ? tokenError.message : undefined
        }, { status: 500 });
      }
      
      // Send the password reset email to the user's primary email
      console.log(`Attempting to send email to ${user.email}`);
      try {
        const emailSent = await sendPasswordResetEmail(
          user.email,
          resetToken,
          user.firstName || 'User',
          user.lastName || ''
        );
        
        if (!emailSent) {
          console.error(`Failed to send password reset email to ${user.email}. Email configuration issue.`);
          
          // In development, provide the token in the response for testing
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEVELOPMENT MODE] Providing reset token in response. Token: ${resetToken}`);
            console.log(`Reset password URL: http://localhost:3000/reset-password?token=${resetToken}`);
            
            return NextResponse.json({ 
              success: false, 
              error: 'Could not send email, but here is your reset token (development mode only)',
              devToken: resetToken,
              devResetUrl: `http://localhost:3000/reset-password?token=${resetToken}`
            }, { status: 200 });
          }
          
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to send password reset email. Please try again later.' 
          }, { status: 500 });
        }
      } catch (emailError: any) {
        console.error('Error in email sending process:', emailError);
        
        // In development, provide the token in the response for testing
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[DEVELOPMENT MODE] Providing reset token in response despite error. Token: ${resetToken}`);
          console.log(`Reset password URL: http://localhost:3000/reset-password?token=${resetToken}`);
          
          return NextResponse.json({ 
            success: false, 
            error: 'Email error, but here is your reset token (development mode only)',
            devToken: resetToken,
            devResetUrl: `http://localhost:3000/reset-password?token=${resetToken}`,
            details: emailError.message
          }, { status: 200 });
        }
        
        return NextResponse.json({ 
          success: false, 
          error: 'Error sending email. Please try again later.',
          details: process.env.NODE_ENV !== 'production' ? emailError.message : undefined
        }, { status: 500 });
      }
      
      console.log(`Password reset email sent to ${user.email} for Service ID ${serviceId}`);
      return NextResponse.json({ 
        success: true,
        message: 'If your Service ID is registered in our system, you will receive a password reset link at your registered email address.'
      });
    } catch (error: any) {
      console.error('Password reset process error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'An error occurred during password recovery. Please try again later.',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Unhandled password reset error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again later.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
} 