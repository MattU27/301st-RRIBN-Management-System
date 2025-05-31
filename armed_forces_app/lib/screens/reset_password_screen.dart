import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart';

import '../core/constants/app_constants.dart';
import '../core/theme/app_theme.dart';
import '../core/services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import './login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String email;
  final String resetToken;
  final String verificationCode;
  
  const ResetPasswordScreen({
    Key? key,
    required this.email,
    required this.resetToken,
    required this.verificationCode,
  }) : super(key: key);

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  
  bool _isLoading = false;
  String? _errorMessage;
  bool _passwordResetSuccess = false;
  
  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _errorMessage = 'Passwords do not match';
      });
      return;
    }
    
    // Prevent users from reusing their current password
    // This is a client-side check that adds an extra layer of security
    final authService = Provider.of<AuthService>(context, listen: false);
    
    try {
      // Check if this might be the current password
      // A more comprehensive check would be done on the server
      final result = await authService.checkIfCurrentPassword(
        email: widget.email, 
        password: _passwordController.text
      );
      
      if (result['mightBeCurrent']) {
        setState(() {
          _errorMessage = 'You cannot reuse your current password. Please choose a different password.';
        });
        return;
      }
    } catch (e) {
      // If the check fails, continue with reset as it's better to allow reset than block it
      // Just log the error
      if (kDebugMode) {
        print('Error checking current password: $e');
      }
    }
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      
      final result = await authService.resetPassword(
        email: widget.email,
        resetToken: widget.resetToken,
        verificationCode: widget.verificationCode,
        newPassword: _passwordController.text,
      );
      
      setState(() {
        if (result['success']) {
          _passwordResetSuccess = true;
        } else {
          _errorMessage = result['message'] ?? 'Failed to reset password. Please try again.';
        }
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'An unexpected error occurred. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.primaryColor),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Reset Password',
          style: GoogleFonts.roboto(
            color: AppTheme.textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: _passwordResetSuccess ? _buildSuccessView() : _buildFormView(),
          ),
        ),
      ),
    );
  }
  
  Widget _buildFormView() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Text(
            "Create New Password",
            style: GoogleFonts.roboto(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimaryColor,
            ),
          ).animate().fadeIn(duration: 600.ms).slideY(
            begin: -30,
            end: 0,
            curve: Curves.easeOutQuad,
            duration: 800.ms,
          ),
          const SizedBox(height: 12),
          
          Text(
            "Your identity has been verified. Please create a new password for your account.",
            style: GoogleFonts.roboto(
              fontSize: 16,
              color: AppTheme.textSecondaryColor,
            ),
          ).animate().fadeIn(delay: 200.ms, duration: 600.ms),
          
          const SizedBox(height: 32),
          
          // Security icon
          Center(
            child: Container(
              width: 100,
              height: 100,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.lock_reset,
                size: 48,
                color: AppTheme.primaryColor,
              ),
            ),
          ).animate().fadeIn(delay: 300.ms, duration: 600.ms),
          
          const SizedBox(height: 32),
          
          // Error message if any
          if (_errorMessage != null)
            Container(
              padding: const EdgeInsets.all(AppConstants.smallPadding),
              margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppConstants.buttonRadius),
                border: Border.all(color: AppTheme.errorColor),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: AppTheme.errorColor,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: AppTheme.errorColor),
                    ),
                  ),
                ],
              ),
            ).animate().shake(),
          
          // Password field
          CustomTextField(
            controller: _passwordController,
            labelText: 'New Password',
            hintText: 'Enter your new password',
            prefixIcon: Icons.lock_outline,
            isPassword: true,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your new password';
              }
              if (value.length < 8) {
                return 'Password must be at least 8 characters';
              }
              
              // Basic check for common passwords to prevent reuse
              if (value == 'password' || value == '123456' || value == 'admin123') {
                return 'This password is too common. Please choose a more secure password.';
              }
              
              return null;
            },
          ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
          
          Padding(
            padding: const EdgeInsets.only(left: 12.0, top: 4.0, bottom: 16.0),
            child: Text(
              'Choose a strong password that you haven\'t used before.',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondaryColor.withOpacity(0.7),
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Confirm password field
          CustomTextField(
            controller: _confirmPasswordController,
            labelText: 'Confirm Password',
            hintText: 'Confirm your new password',
            prefixIcon: Icons.lock_outline,
            isPassword: true,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please confirm your password';
              }
              if (value != _passwordController.text) {
                return 'Passwords do not match';
              }
              return null;
            },
          ).animate().fadeIn(delay: 500.ms, duration: 600.ms),
          
          const SizedBox(height: 32),
          
          // Submit button
          CustomButton(
            text: 'Reset Password',
            isLoading: _isLoading,
            onPressed: _resetPassword,
          ).animate().fadeIn(delay: 600.ms, duration: 600.ms),
        ],
      ),
    );
  }
  
  Widget _buildSuccessView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        
        // Success icon
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: AppTheme.successColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle,
            size: 80,
            color: AppTheme.successColor,
          ),
        ).animate().scale(
          duration: 600.ms,
          curve: Curves.elasticOut,
        ),
        
        const SizedBox(height: 32),
        
        // Success message
        Text(
          "Password Reset Successful!",
          style: GoogleFonts.roboto(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimaryColor,
          ),
          textAlign: TextAlign.center,
        ).animate().fadeIn(duration: 600.ms),
        
        const SizedBox(height: 16),
        
        Text(
          "Your password has been reset successfully. You can now use your new password to log in to your account.",
          textAlign: TextAlign.center,
          style: GoogleFonts.roboto(
            fontSize: 16,
            color: AppTheme.textSecondaryColor,
          ),
        ).animate().fadeIn(delay: 200.ms, duration: 600.ms),
        
        const SizedBox(height: 40),
        
        // Login button
        CustomButton(
          text: 'Go to Login',
          onPressed: () {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (context) => const LoginScreen()),
              (route) => false,
            );
          },
        ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
      ],
    );
  }
} 