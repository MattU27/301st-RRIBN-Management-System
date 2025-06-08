import { NextResponse } from 'next/server';
import { sendEmail, sendRegistrationConfirmationEmail } from '@/services/emailService';

export async function GET(request: Request) {
  try {
    // Extract recipient from query parameters
    const url = new URL(request.url);
    const recipient = url.searchParams.get('to');
    
    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'No recipient specified. Use ?to=email@example.com' },
        { status: 400 }
      );
    }
    
    // Log email service configuration
    const emailConfig = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'not set',
      passSet: !!process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM,
      env: process.env.NODE_ENV,
    };
    
    // Test both direct email and registration confirmation
    const simpleResult = await sendEmail({
      to: recipient,
      subject: 'Test Email from 301st RRIBN System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #092140;">Test Email</h2>
          <p>This is a test email from the 301st RRIBN Personnel Management System.</p>
          <p>Current time: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
        </div>
      `,
    });
    
    const regResult = await sendRegistrationConfirmationEmail(
      recipient,
      'Test',
      'User'
    );
    
    return NextResponse.json({
      success: simpleResult && regResult,
      simpleEmailSent: simpleResult,
      registrationEmailSent: regResult,
      emailConfig,
      message: 'Email test complete. Check your inbox and server logs for more details.',
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
} 