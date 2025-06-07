import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../core/constants/app_constants.dart';
import '../core/theme/app_theme.dart';
import '../core/services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import './login_screen.dart';
import './verify_code_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _serviceIdController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _emailSent = false;
  String? _errorMessage;
  
  // Recovery method selection
  String _recoveryMethod = 'email'; // 'email' or 'serviceId'
  
  // Two-factor authentication is always enabled for security
  final bool _useTwoFactor = true; // Made final and always true

  @override
  void dispose() {
    _emailController.dispose();
    _serviceIdController.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      Map<String, dynamic> result;
      
      if (_recoveryMethod == 'email') {
        result = await authService.forgotPassword(
          _emailController.text.trim(),
          twoFactor: _useTwoFactor, // Always true
        );
      } else {
        result = await authService.forgotPassword(
          '', // Empty email
          serviceId: _serviceIdController.text.trim(),
          twoFactor: _useTwoFactor, // Always true
        );
      }

      if (result['success']) {
        setState(() {
          _emailSent = true;
          _errorMessage = result['message'];
        });
        
        // If using two-factor, navigate to verification screen
        if (_useTwoFactor && mounted) {
          // In a real app, the resetToken would come from the API response
          // For demo, generate a dummy token
          final dummyResetToken = 'reset-token-${DateTime.now().millisecondsSinceEpoch}';
          
          // Wait a moment to show the success screen
          await Future.delayed(const Duration(seconds: 2));
          
          if (mounted) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => VerifyCodeScreen(
                  email: _recoveryMethod == 'email' 
                      ? _emailController.text.trim()
                      : '', // In a real app, this would be the primary email from the API
                  resetToken: dummyResetToken,
                ),
              ),
            );
          }
        }
      } else {
        setState(() {
          _errorMessage = result['message'];
        });
      }
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
          'Forgot Password',
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
            child: _emailSent ? _buildSuccessView() : _buildFormView(),
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
            "Reset Your Password",
            style: GoogleFonts.roboto(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimaryColor,
            ),
          ).animate().fadeIn(duration: 600.ms).slideX(
            begin: -30,
            end: 0,
            curve: Curves.easeOutQuad,
            duration: 800.ms,
          ),
          const SizedBox(height: 12),
          
          Text(
            "Please choose a recovery method to reset your password.",
            style: GoogleFonts.roboto(
              fontSize: 16,
              color: AppTheme.textSecondaryColor,
            ),
          ).animate().fadeIn(delay: 200.ms, duration: 600.ms),
          
          const SizedBox(height: 32),
          
          // Recovery Method Selection
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade300),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  spreadRadius: 1,
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                // Email option
                RadioListTile<String>(
                  title: Text('Recover with Alternative Email',
                    style: GoogleFonts.roboto(
                      fontWeight: FontWeight.w500,
                      fontSize: 16,
                    ),
                  ),
                  subtitle: Text('Send a reset link to your registered alternative email (gmail, outlook, etc.)',
                    style: GoogleFonts.roboto(
                      fontSize: 14,
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  value: 'email',
                  groupValue: _recoveryMethod,
                  activeColor: AppTheme.primaryColor,
                  onChanged: (value) {
                    setState(() {
                      _recoveryMethod = value!;
                    });
                  },
                ),
                
                const Divider(height: 1),
                
                // Service ID option
                RadioListTile<String>(
                  title: Text('Recover with Military Email',
                    style: GoogleFonts.roboto(
                      fontWeight: FontWeight.w500,
                      fontSize: 16,
                    ),
                  ),
                  subtitle: Text('Use your Military issued email and it will automatically send a reset link to your primary @mil.ph email',
                    style: GoogleFonts.roboto(
                      fontSize: 14,
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  value: 'serviceId',
                  groupValue: _recoveryMethod,
                  activeColor: AppTheme.primaryColor,
                  onChanged: (value) {
                    setState(() {
                      _recoveryMethod = value!;
                    });
                  },
                ),
              ],
            ),
          ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
          
          const SizedBox(height: 32),
          
          // Illustration
          Center(
            child: Container(
              width: 120,
              height: 120,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_reset,
                size: 60,
                color: AppTheme.primaryColor,
              ),
            ),
          ).animate().fadeIn(delay: 500.ms, duration: 800.ms),
          
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
          
          // Input fields based on selected method
          if (_recoveryMethod == 'email')
            CustomTextField(
              controller: _emailController,
              labelText: 'Alternative Email',
              hintText: 'Enter your alternative email address',
              prefixIcon: Icons.email,
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Alternative email is required';
                }
                // More comprehensive email validation
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$').hasMatch(value)) {
                  return 'Please enter a valid email address';
                }
                // Prevent mil.ph emails in the alternative email field
                if (value.toLowerCase().endsWith('@mil.ph')) {
                  return 'Please use a non-military email address';
                }
                return null;
              },
            ).animate().fadeIn(delay: 600.ms, duration: 600.ms)
          else
            CustomTextField(
              controller: _serviceIdController,
              labelText: 'Military Email',
              hintText: 'Enter your Military Email (@mil.ph)',
              prefixIcon: Icons.email,
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Military Email is required';
                }
                if (!value.toLowerCase().endsWith('@mil.ph')) {
                  return 'Please enter a valid Military Email (@mil.ph)';
                }
                if (!RegExp(r'^[\w-\.]+@mil\.ph$').hasMatch(value)) {
                  return 'Please enter a valid email format';
                }
                return null;
              },
            ).animate().fadeIn(delay: 600.ms, duration: 600.ms),
          
          const SizedBox(height: 16),
          
          // Two-factor authentication option
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.05),
                  spreadRadius: 1,
                  blurRadius: 2,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(
                  Icons.verified_user,
                  color: Colors.blue.shade700,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Two-Factor Authentication Enabled',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: AppTheme.textPrimaryColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'For your security, a verification code will be sent to your email',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 700.ms, duration: 600.ms),
          
          const SizedBox(height: 32),
          
          // Submit button
          CustomButton(
            text: 'Send Reset Link',
            isLoading: _isLoading,
            onPressed: _resetPassword,
          ).animate().fadeIn(delay: 800.ms, duration: 600.ms).scale(
            begin: const Offset(0.95, 0.95),
            end: const Offset(1, 1),
            duration: 800.ms,
          ),
          
          const SizedBox(height: 24),
          
          // Back to login
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Remember your password?'),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text(
                  'Login',
                  style: TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ).animate().fadeIn(delay: 1000.ms, duration: 600.ms),
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
          "Email Sent!",
          style: GoogleFonts.roboto(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimaryColor,
          ),
        ).animate().fadeIn(duration: 600.ms),
        
        const SizedBox(height: 16),
        
        // Display the exact message from the service, which now includes the email address
        Text(
          _errorMessage != null 
            ? _errorMessage!
            : "We've sent password reset instructions and a verification code to the email address associated with your account. Please check your inbox and follow the instructions to reset your password.",
          textAlign: TextAlign.center,
          style: GoogleFonts.roboto(
            fontSize: 16,
            color: AppTheme.textSecondaryColor,
          ),
        ).animate().fadeIn(delay: 200.ms, duration: 600.ms),
        
        // Always show verification code info since two-factor is always enabled
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.primaryColor.withOpacity(0.2)),
          ),
          child: Row(
            children: [
              Icon(
                Icons.info_outline,
                color: AppTheme.primaryColor,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'You will need to enter the verification code sent to your email to complete the password reset.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: 400.ms, duration: 600.ms),
        
        const SizedBox(height: 40),
        
        // Return to login button
        CustomButton(
          text: 'Return to Login',
          onPressed: () {
            Navigator.of(context).pop();
          },
        ).animate().fadeIn(delay: 600.ms, duration: 600.ms),
        
        const SizedBox(height: 16),
        
        TextButton.icon(
          onPressed: () {
            setState(() {
              _emailSent = false;
              _emailController.clear();
              _serviceIdController.clear();
            });
          },
          icon: const Icon(Icons.refresh, color: AppTheme.primaryColor),
          label: Text(
            'Try another method',
            style: GoogleFonts.roboto(
              color: AppTheme.primaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ).animate().fadeIn(delay: 800.ms, duration: 600.ms),
      ],
    );
  }
} 