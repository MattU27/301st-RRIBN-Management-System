# Email Configuration Guide for 301st RRIBN System

This guide will help you set up email functionality for the 301st RRIBN Personnel Management System.

## Why Email Configuration is Important

The system needs to send emails for:
- Registration confirmations
- Account approval notifications
- Password reset links
- Important announcements

## Setting Up Gmail for Application

The recommended approach is to use Gmail with an App Password:

1. **Create a Gmail account** for your organization if you don't already have one
2. **Enable 2-Step Verification** on your Google account:
   - Go to your [Google Account Security settings](https://myaccount.google.com/security)
   - Scroll to "2-Step Verification" and turn it on
   - Follow the steps to set up 2-Step Verification

3. **Generate an App Password**:
   - Go to [App passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app and "Other" as the device (name it "301st RRIBN System")
   - Click "Generate"
   - Google will display a 16-character password - **copy this password**

## Configuration Steps

### Option 1: Update the .env File

1. Open `.env` file in the project root
2. Find the EMAIL section and update these values:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=301st RRIBN <your-gmail-address@gmail.com>
```

### Option 2: Update Environment Variables in Deployment

If you're using a deployment platform like Vercel, Netlify, or Railway:

1. Go to your project settings
2. Find Environment Variables section
3. Add the following variables:
   - `EMAIL_HOST`: smtp.gmail.com
   - `EMAIL_PORT`: 587
   - `EMAIL_USER`: your-gmail-address@gmail.com
   - `EMAIL_PASS`: your-16-character-app-password
   - `EMAIL_FROM`: 301st RRIBN <your-gmail-address@gmail.com>

## Testing Your Configuration

After setting up the email configuration:

1. Run the application
2. Visit `/api/test-email?to=your-test-email@example.com` in your browser
3. Check your test email inbox for the test message

If the test email is received, your email configuration is working correctly!

## Troubleshooting

If emails are not being sent:

1. **Check server logs** for error messages related to email sending
2. **Verify credentials** are correct in your environment variables
3. **Ensure 2-Step Verification** is enabled and the App Password is generated correctly
4. **Try using a different Gmail account** if problems persist
5. **Check Gmail settings** - make sure your account doesn't have restrictions that would prevent automated emails

## Security Notes

- Never commit your email password to version control
- Use environment variables for all sensitive credentials
- Consider rotating your App Password periodically for security
- The App Password gives access to your Gmail account, so keep it secure

## Support

If you continue to have issues with email configuration, please contact the system administrator or refer to [Nodemailer documentation](https://nodemailer.com/about/) for more detailed troubleshooting steps. 