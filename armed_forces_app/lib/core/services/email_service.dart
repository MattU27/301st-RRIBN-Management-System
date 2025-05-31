import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';
import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

class EmailService {
  static final EmailService _instance = EmailService._internal();
  final Logger _logger = Logger();
  
  // Singleton pattern
  factory EmailService() => _instance;
  
  EmailService._internal();
  
  // Mailtrap SMTP configuration
  SmtpServer get _smtpServer => SmtpServer(
    'sandbox.smtp.mailtrap.io',
    port: 2525,
    username: '9db9221c098e23',
    password: 'c1b0d39043bdd9', // Replace with your actual full Mailtrap password
    ssl: false,
    allowInsecure: true,
  );
  
  Future<bool> sendPasswordResetEmail({
    required String toEmail,
    required String resetToken,
    String? verificationCode,
  }) async {
    try {
      final message = Message()
        ..from = const Address('noreply@afp.mil.ph', 'AFP Personnel System')
        ..recipients.add(toEmail)
        ..subject = 'Password Reset Request - 301st READY RESERVE'
        ..html = '''
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                padding: 20px 0;
                background-color: #092140;
                color: white;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
                margin-bottom: 20px;
              }
              .content {
                padding: 20px;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666666;
                font-size: 12px;
                border-top: 1px solid #eeeeee;
              }
              h1 {
                color: #ffffff;
                margin: 0;
                padding: 0;
                font-size: 24px;
              }
              h2 {
                color: #092140;
                margin-top: 0;
              }
              .verification-code {
                font-size: 30px;
                font-weight: bold;
                color: #092140;
                text-align: center;
                padding: 20px;
                margin: 20px 0;
                background-color: #f0f7ff;
                border: 1px solid #d0e3ff;
                border-radius: 4px;
                letter-spacing: 4px;
              }
              .instructions {
                background-color: #fffde7;
                border-left: 4px solid #ffd600;
                padding: 12px 15px;
                margin: 20px 0;
              }
              .note {
                font-size: 13px;
                color: #666666;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>301st READY RESERVE</h1>
              </div>
              <div class="content">
                <h2>Password Reset Verification</h2>
                
                <p>You have requested to reset your password for the AFP Personnel System.</p>
                
                <div class="instructions">
                  <strong>Instructions:</strong>
                  <ol>
                    <li>Enter the verification code below in your mobile app</li>
                    <li>Follow the steps in the app to create a new password</li>
                  </ol>
                </div>
                
                <p><strong>Your verification code:</strong></p>
                
                <div class="verification-code">${verificationCode ?? 'XXXXXX'}</div>
                
                <p class="note">This verification code will expire in 15 minutes.</p>
                <p class="note">If you did not request a password reset, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>Regards,<br>AFP Personnel System</p>
                <p>&copy; ${DateTime.now().year} Armed Forces of the Philippines. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        ''';
      
      if (kDebugMode) {
        print('Sending password reset email to: $toEmail');
        if (verificationCode != null) {
          print('Verification code: $verificationCode');
        }
        print('Reset token: $resetToken');
      }
      
      final sendReport = await send(message, _smtpServer);
      
      if (kDebugMode) {
        print('Email send report: ${sendReport.toString()}');
      }
      
      _logger.i('Password reset email sent to: $toEmail');
      return true;
    } catch (e) {
      _logger.e('Error sending password reset email: $e');
      if (kDebugMode) {
        print('Error sending password reset email: $e');
      }
      return false;
    }
  }
} 