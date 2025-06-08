// @ts-ignore
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// This would typically come from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || 'your-email@example.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your-password';
const EMAIL_FROM = process.env.EMAIL_FROM || '301st RRIBN <noreply@afp.mil.ph>';

// Flag to indicate if we're using a properly configured email service
const hasValidEmailConfig = process.env.EMAIL_HOST && 
                           process.env.EMAIL_USER && 
                           process.env.EMAIL_PASS &&
                           process.env.EMAIL_USER !== 'your-email@example.com';

console.log('Email Configuration:');
console.log(`- Environment: ${process.env.NODE_ENV}`);
console.log(`- Host: ${EMAIL_HOST}`);
console.log(`- Port: ${EMAIL_PORT}`);
console.log(`- User: ${EMAIL_USER.substring(0, 3)}***${EMAIL_USER.includes('@') ? EMAIL_USER.substring(EMAIL_USER.indexOf('@')) : ''}`);
console.log(`- Has Password: ${!!EMAIL_PASS}`);
console.log(`- From: ${EMAIL_FROM}`);
console.log(`- Valid Config: ${hasValidEmailConfig}`);

// Create a nodemailer transporter with better error handling
let transporter: any;

try {
  if (hasValidEmailConfig) {
    console.log('Initializing email transporter with configured settings');
    // Create nodemailer transporter with provided credentials
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      // Add debug option for development
      ...(process.env.NODE_ENV !== 'production' && { debug: true }),
    });
    
    // Verify transporter
    transporter.verify((error: any, success: boolean) => {
      if (error) {
        console.error('Transporter verification failed:', error);
      } else {
        console.log('Server is ready to take our messages');
      }
    });
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('Using ethereal.email test account for development');
    // In development, if no email config, create a test account with ethereal.email
    try {
      nodemailer.createTestAccount().then(testAccount => {
        console.log('Test email account created:', testAccount.user);
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
          debug: true,
        });
      }).catch(err => {
        console.error('Could not create test email account:', err);
      });
    } catch (etherealError) {
      console.error('Error setting up ethereal test account:', etherealError);
    }
  } else {
    console.warn('Email service not properly configured. Emails will not be sent.');
    
    // For production, if no valid email config, try to use Gmail as fallback
    console.log('Attempting to use Gmail as fallback in production...');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      }
    });
    
    // Verify transporter
    transporter.verify((error: any, success: boolean) => {
      if (error) {
        console.error('Fallback Gmail transporter verification failed:', error);
      } else {
        console.log('Fallback Gmail transporter is ready');
      }
    });
  }
} catch (error) {
  console.error('Error creating nodemailer transporter:', error);
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  // For development without email config, just log and return success
  if (process.env.NODE_ENV !== 'production' && !transporter) {
    console.log('===== DEVELOPMENT MODE: EMAIL WOULD BE SENT =====');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(html);
    console.log('===============================================');
    return true;
  }

  if (!transporter) {
    console.error('Email transporter not initialized');
    return false;
  }

  try {
    console.log(`Attempting to send email to ${to}`);
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    console.log(`Email response:`, info);
    
    // If using Ethereal, log the preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Try using Gmail API as last resort
    if (process.env.NODE_ENV === 'production') {
      try {
        console.log('Attempting to send via Gmail API as last resort...');
        const gmailTransport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
          }
        });
        
        const fallbackInfo = await gmailTransport.sendMail({
          from: EMAIL_FROM,
          to,
          subject: subject + ' (Retry)',
          html,
        });
        
        console.log(`Fallback email sent: ${fallbackInfo.messageId}`);
        return true;
      } catch (fallbackError) {
        console.error('Fallback email attempt also failed:', fallbackError);
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Send a password reset email with a reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  firstName: string,
  lastName: string
): Promise<boolean> {
  // For testing/development, log the reset token
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
  }
  
  // The base URL would typically come from an environment variable
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        body {
          font-family: 'Roboto', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        .header {
          background-color: #092140;
          color: white;
          padding: 24px 0;
          text-align: center;
          border-bottom: 4px solid #D1B000;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        
        .header p {
          margin: 5px 0 0;
          color: #D1B000;
          font-weight: 500;
          font-size: 16px;
        }
        
        .content {
          padding: 30px 40px;
          background-color: #ffffff;
        }
        
        .title {
          color: #092140;
          font-size: 22px;
          margin-top: 0;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 600;
        }
        
        .message p {
          margin-bottom: 16px;
          color: #444;
          font-size: 16px;
        }
        
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        
        .reset-button {
          display: inline-block;
          background-color: #092140;
          color: white !important;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.5px;
          transition: background-color 0.3s;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .reset-button:hover {
          background-color: #0c2c54;
        }
        
        .link-container {
          background-color: #f7f7f7;
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
          word-break: break-all;
          border: 1px solid #eeeeee;
        }
        
        .link-text {
          font-size: 14px;
          color: #666;
          margin-bottom: 6px;
        }
        
        .reset-link {
          color: #0066cc;
          text-decoration: none;
          font-size: 14px;
          word-break: break-all;
        }
        
        .notice {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #666;
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          background-color: #f9f9f9;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #eee;
        }
        
        .signature {
          margin-top: 24px;
        }
        
        .logo-container {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: rgba(209, 176, 0, 0.2);
          padding: 10px;
        }
        
        @media only screen and (max-width: 480px) {
          .content {
            padding: 20px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .title {
            font-size: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>301st READY RESERVE</h1>
          <p>INFANTRY BATTALION</p>
        </div>
        
        <div class="content">
          <div class="logo-container">
            <img src="${baseUrl}/battalion-seal.png" alt="301st Battalion Seal" class="logo" />
          </div>
          
          <h2 class="title">Password Reset Request</h2>
          
          <div class="message">
            <p>Dear ${firstName} ${lastName},</p>
            <p>We received a request to reset your password for your 301st READY RESERVE account. If you did not make this request, please ignore this email.</p>
            <p>To reset your password, click the button below:</p>
          </div>
          
          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </div>
          
          <p class="link-text">Or copy and paste this link into your browser:</p>
          <div class="link-container">
            <a href="${resetUrl}" class="reset-link">${resetUrl}</a>
          </div>
          
          <p style="color: #d74c4c; font-weight: 500;">This link will expire in 1 hour for security reasons.</p>
          
          <div class="notice">
            <p>If you need further assistance, please contact our support team.</p>
            
            <div class="signature">
              <p>Best regards,<br><strong>301st READY RESERVE INFANTRY BATTALION</strong></p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} 301st READY RESERVE INFANTRY BATTALION. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - 301st READY RESERVE',
    html,
  });
}

/**
 * Send a registration confirmation email
 */
export async function sendRegistrationConfirmationEmail(
  email: string,
  firstName: string,
  lastName: string
): Promise<boolean> {
  console.log(`Preparing registration confirmation email for ${email}`);
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        body {
          font-family: 'Roboto', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        .header {
          background-color: #092140;
          color: white;
          padding: 24px 0;
          text-align: center;
          border-bottom: 4px solid #D1B000;
        }
        
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        
        .header p {
          margin: 5px 0 0;
          color: #D1B000;
          font-weight: 500;
          font-size: 16px;
        }
        
        .content {
          padding: 30px 40px;
          background-color: #ffffff;
        }
        
        .title {
          color: #092140;
          font-size: 22px;
          margin-top: 0;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 600;
        }
        
        .message p {
          margin-bottom: 16px;
          color: #444;
          font-size: 16px;
        }
        
        .status-badge {
          display: inline-block;
          background-color: #FFC107;
          color: #333;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 20px;
        }
        
        .info-box {
          background-color: #f5f7fa;
          border-left: 4px solid #4a6fa5;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        
        .info-box h4 {
          margin-top: 0;
          color: #4a6fa5;
        }
        
        .footer {
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #666;
          background-color: #f5f5f5;
          border-top: 1px solid #eeeeee;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>301st READY RESERVE</h1>
          <p>INFANTRY BATTALION</p>
        </div>
        
        <div class="content">
          <h2 class="title">Registration Confirmation</h2>
          
          <div style="text-align: center;">
            <span class="status-badge">PENDING APPROVAL</span>
          </div>
          
          <div class="message">
            <p>Dear ${firstName} ${lastName},</p>
            
            <p>Thank you for registering with the 301st Ready Reserve Infantry Battalion Personnel Management System. Your account has been created and is currently pending approval from an administrator.</p>
            
            <p>Once your account is approved, you will receive another email notification with instructions on how to access the system.</p>
            
            <div class="info-box">
              <h4>Registration Details</h4>
              <p><strong>Name:</strong> ${firstName} ${lastName}<br>
              <strong>Email:</strong> ${email}<br>
              <strong>Date:</strong> ${new Date().toLocaleString()}<br>
              <strong>Status:</strong> Pending Admin Approval</p>
              
              <p>Please keep this information for your records.</p>
            </div>
            
            <p>If you have any questions or need further assistance, please contact your unit administrator at <a href="mailto:admin@301strribn.ph">admin@301strribn.ph</a>.</p>
            
            <p>
              Regards,<br>
              301st Ready Reserve Infantry Battalion<br>
              Personnel Management Team
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Armed Forces of the Philippines</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: email,
      subject: '301st RRIBN - Registration Confirmation',
      html
    });
    
    console.log(`Registration confirmation email ${result ? 'sent successfully' : 'failed to send'} to ${email}`);
    return result;
  } catch (error) {
    console.error(`Failed to send registration confirmation email to ${email}:`, error);
    return false;
  }
} 