import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../core/constants/app_constants.dart';
import '../core/theme/app_theme.dart';
import '../core/services/auth_service.dart';
import '../widgets/custom_button.dart';
import '../widgets/custom_text_field.dart';
import './login_screen.dart';
import './dashboard_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Step control
  int _currentStep = 0;
  final int _totalSteps = 2;
  
  // Controllers for form fields
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _afpEmailController = TextEditingController();
  final TextEditingController _alternativeEmailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final TextEditingController _serviceIdController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();
  
  // Form keys for validation
  final GlobalKey<FormState> _basicInfoFormKey = GlobalKey<FormState>();
  final GlobalKey<FormState> _accountFormKey = GlobalKey<FormState>();
  
  // State variables
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _errorMessage;
  
  // Dropdown values
  String? _selectedRank;
  String? _selectedCompany;
  String? _selectedStatus = 'Standby'; // Default value

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _afpEmailController.dispose();
    _alternativeEmailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _serviceIdController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  // Move to next step if validation passes
  void _nextStep() {
    if (_currentStep == 0 && _basicInfoFormKey.currentState!.validate()) {
      setState(() {
        _currentStep++;
      });
    }
  }

  // Move to previous step
  void _prevStep() {
    if (_currentStep > 0) {
      setState(() {
        _currentStep--;
      });
    } else {
      Navigator.of(context).pop();
    }
  }

  // Handle registration submission
  Future<void> _register() async {
    if (_accountFormKey.currentState!.validate()) {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      
        if (kDebugMode) {
          print('Starting registration for: ${_afpEmailController.text.trim()}');
        }
      
      final result = await authService.register(
          email: _afpEmailController.text.trim(),
          alternativeEmail: _alternativeEmailController.text.trim(),
        password: _passwordController.text,
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          serviceNumber: _serviceIdController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          rank: _selectedRank,
          company: _selectedCompany,
          status: _selectedStatus,
          address: _addressController.text.trim(),
        );

        if (kDebugMode) {
      print('Registration result: $result');
        }

      if (result['success']) {
        if (mounted) {
            // Show enhanced success dialog with approval information and visual improvements
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (BuildContext context) {
                return Dialog(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  elevation: 0,
                  backgroundColor: Colors.transparent,
                  child: Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.rectangle,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black26,
                          blurRadius: 10.0,
                          offset: Offset(0.0, 10.0),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Success animation
                        Container(
                          padding: EdgeInsets.all(15),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.check_circle_outline,
                            color: Colors.green,
                            size: 80,
                          ),
                        ).animate().scale(
                          duration: Duration(milliseconds: 500),
                          curve: Curves.elasticOut,
                        ),
                        SizedBox(height: 15),
                        
                        // Success title
                        Text(
                          'Registration Successful',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimaryColor,
                          ),
                        ),
                        SizedBox(height: 15),
                        
                        // Success message
                        Text(
                          'Your account has been registered successfully.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: AppTheme.textPrimaryColor,
                          ),
                        ),
                        SizedBox(height: 15),
                        
                        // Approval information box
                        Container(
                          padding: EdgeInsets.all(15),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.info_outline,
                                color: Colors.blue.shade700,
                                size: 24,
                              ),
                              SizedBox(width: 10),
                              Flexible(
                                child: Text(
                                  'Your account will require staff approval. You will receive an email notification when approved.',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.blue.shade700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 20),
                        
                        // Continue to login button
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            minimumSize: Size(double.infinity, 50),
                          ),
                          onPressed: () {
                            Navigator.of(context).pop();
                            Navigator.pushReplacementNamed(context, '/login');
                          },
                          child: Text(
                            'Continue to Login',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
        }
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Registration failed.';
        });
      }
    } catch (e) {
        if (kDebugMode) {
      print('Registration exception: $e');
        }
      setState(() {
        _errorMessage = 'An unexpected error occurred. Please try again.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      }
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
          onPressed: _prevStep,
        ),
        title: Text(
          'Create Account',
          style: GoogleFonts.roboto(
            color: AppTheme.textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
          child: Column(
            children: [
            // Header
              Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                      children: [
                        Text(
                          "301st READY RESERVE INFANTRY BATTALION",
                    textAlign: TextAlign.center,
                          style: GoogleFonts.robotoCondensed(
                      fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                      letterSpacing: 1,
                    ),
                          ),
                  const SizedBox(height: 4),
                        Text(
                          "Personnel Management System",
                          style: GoogleFonts.roboto(
                            fontSize: 14,
                            color: AppTheme.textSecondaryColor,
                          ),
                    ),
                  ],
                ),
              ),
              
                      // Error message if any
                      if (_errorMessage != null)
                        Container(
                margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.errorColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.errorColor),
                          ),
                          child: Row(
                            children: [
                    const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_errorMessage!, style: const TextStyle(color: AppTheme.errorColor))),
                  ],
                ),
              ),
            
            // Step indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: List.generate(_totalSteps, (index) {
                  bool isActive = index <= _currentStep;
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: EdgeInsets.only(right: index < _totalSteps - 1 ? 8 : 0),
                      decoration: BoxDecoration(
                        color: isActive ? AppTheme.primaryColor : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  );
                }),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Form content based on current step
                              Expanded(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: _buildCurrentStep(),
                ),
                                ),
                              ),
                            ],
                          ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildBasicInfoStep();
      case 1:
        return _buildAccountInfoStep();
      default:
        return Container();
    }
  }

  Widget _buildBasicInfoStep() {
    return Form(
      key: _basicInfoFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Form title
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: Text(
              'Personal Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
          ),
          
          // First Name field
                      CustomTextField(
            controller: _firstNameController,
            labelText: 'First Name',
            hintText: 'Enter your first name',
                        prefixIcon: Icons.person,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                return 'First name is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          
          // Last Name field
          CustomTextField(
            controller: _lastNameController,
            labelText: 'Last Name',
            hintText: 'Enter your last name',
            prefixIcon: Icons.person_outline,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Last name is required';
                          }
                          return null;
                        },
          ),
                      const SizedBox(height: 20),
                      
          // Service ID field
                      CustomTextField(
            controller: _serviceIdController,
            labelText: 'Service ID',
            hintText: 'Enter your service ID',
            prefixIcon: Icons.badge,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                return 'Service ID is required';
                          }
                          return null;
                        },
          ),
                      Padding(
            padding: const EdgeInsets.only(left: 12.0, top: 4.0, bottom: 16.0),
                        child: Text(
              'Enter your 301st RRIB Service ID in format: XXX-XXXXX',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondaryColor.withOpacity(0.7),
                            fontStyle: FontStyle.italic,
                          ),
                        ),
          ),
                      
          // AFP Email field
                      CustomTextField(
            controller: _afpEmailController,
            labelText: 'AFP Email Address',
            hintText: 'Enter your official AFP email',
                        prefixIcon: Icons.email,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                return 'AFP email is required';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return 'Please enter a valid email';
              }
              // Check if it's a mil.ph email
              if (!value.toLowerCase().endsWith('mil.ph')) {
                return 'Please enter a valid AFP email (@mil.ph)';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          
          // Alternative Email field
          CustomTextField(
            controller: _alternativeEmailController,
            labelText: 'Alternative Email (Personal)',
            hintText: 'Enter your personal email',
            prefixIcon: Icons.alternate_email,
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Alternative email is required';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                            return 'Please enter a valid email';
                          }
                          return null;
                        },
          ),
          Padding(
            padding: const EdgeInsets.only(left: 12.0, top: 4.0, bottom: 16.0),
            child: Text(
              'Can be used for login and account recovery',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondaryColor.withOpacity(0.7),
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          
          // Phone field
          CustomTextField(
            controller: _phoneController,
            labelText: 'Phone',
            hintText: 'Enter your phone number',
            prefixIcon: Icons.phone,
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Phone number is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 20),
          
          // Address field
          CustomTextField(
            controller: _addressController,
            labelText: 'Address',
            hintText: 'Enter your address',
            prefixIcon: Icons.location_on,
            maxLines: 2,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Address is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          
          // Next button
          CustomButton(
            text: 'Next',
            onPressed: _nextStep,
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildAccountInfoStep() {
    return Form(
      key: _accountFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Form title
          Padding(
            padding: const EdgeInsets.only(bottom: 24.0),
            child: Text(
              'Account Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryColor,
              ),
            ),
          ),
          
          // Rank dropdown with overflow handling (fixed label issue)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Add title above dropdown instead of inside
              Padding(
                padding: const EdgeInsets.only(left: 4.0, bottom: 4.0),
                child: Text(
                  'Rank',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppConstants.buttonRadius),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                child: DropdownButtonFormField<String>(
                  isExpanded: true, // Make dropdown fill width
                  decoration: const InputDecoration(
                    labelText: null, // Remove built-in label
                    prefixIcon: Icon(Icons.military_tech),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12.0),
                  ),
                  value: _selectedRank,
                  hint: const Text('Select your rank'),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Rank is required';
                    }
                    return null;
                  },
                  items: AppConstants.militaryRanks.map((rank) {
                    return DropdownMenuItem<String>(
                      value: rank,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width - 100, // Account for padding and icon
                        ),
                        child: Text(
                          rank,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedRank = value;
                    });
                  },
                  // Add a custom menu to handle long text
                  menuMaxHeight: 300, // Set maximum height for dropdown menu
                  isDense: true, // Make dropdown more compact
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Company dropdown with overflow handling (consistent style)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Add title above dropdown instead of inside
              Padding(
                padding: const EdgeInsets.only(left: 4.0, bottom: 4.0),
                child: Text(
                  'Company',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppConstants.buttonRadius),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                child: DropdownButtonFormField<String>(
                  isExpanded: true, // Make dropdown fill width
                  decoration: const InputDecoration(
                    labelText: null, // Remove built-in label
                    prefixIcon: Icon(Icons.groups),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12.0),
                  ),
                  value: _selectedCompany,
                  hint: const Text('Select your company'),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Company is required';
                    }
                    return null;
                  },
                  items: AppConstants.companies.map((company) {
                    // Handle long company names by using a constrained box
                    return DropdownMenuItem<String>(
                      value: company,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width - 100, // Account for padding and icon
                        ),
                        child: Text(
                          company,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedCompany = value;
                    });
                  },
                  // Add a custom menu to handle long text
                  menuMaxHeight: 300, // Set maximum height for dropdown menu
                  isDense: true, // Make dropdown more compact
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Status dropdown with color indicators (consistent style)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Add title above dropdown instead of inside
              Padding(
                padding: const EdgeInsets.only(left: 4.0, bottom: 4.0),
                child: Text(
                  'Status',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppConstants.buttonRadius),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                child: DropdownButtonFormField<String>(
                  isExpanded: true, // Make dropdown fill width
                  decoration: const InputDecoration(
                    labelText: null, // Remove built-in label
                    prefixIcon: Icon(Icons.info_outline),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12.0),
                  ),
                  value: _selectedStatus,
                  hint: const Text('Select your status'),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Status is required';
                    }
                    return null;
                  },
                  items: AppConstants.reservistStatus.map((status) {
                    // Define color based on status
                    Color statusColor;
                    switch (status) {
                      case 'Ready':
                        statusColor = Colors.green;
                        break;
                      case 'Standby':
                        statusColor = Colors.amber;
                        break;
                      case 'Retired':
                        statusColor = Colors.grey;
                        break;
                      default:
                        statusColor = Colors.blue;
                    }
                    
                    return DropdownMenuItem<String>(
                      value: status,
                      child: Row(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            status,
                            style: TextStyle(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedStatus = value;
                    });
                  },
                ),
              ),
            ],
          ),
                      const SizedBox(height: 20),
                      
          // Password field with requirements
                      CustomTextField(
                        controller: _passwordController,
                        labelText: 'Password',
                        hintText: 'Create a password',
                        prefixIcon: Icons.lock,
                        suffix: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility : Icons.visibility_off,
                            color: AppTheme.textSecondaryColor,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        isPassword: _obscurePassword,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Password is required';
                          }
                          if (value.length < 8) {
                            return 'Password must be at least 8 characters';
                          }
              if (!RegExp(r'[A-Z]').hasMatch(value)) {
                return 'Password must contain at least one uppercase letter';
              }
              if (!RegExp(r'[a-z]').hasMatch(value)) {
                return 'Password must contain at least one lowercase letter';
              }
              if (!RegExp(r'[0-9]').hasMatch(value)) {
                return 'Password must contain at least one number';
              }
              // Check for special characters
              bool hasSpecialChar = false;
              const specials = '!@#%^&*(),.?":{}|<>';
              for (int i = 0; i < value.length; i++) {
                if (specials.contains(value[i])) {
                  hasSpecialChar = true;
                  break;
                }
              }
              if (!hasSpecialChar) {
                return 'Password must contain at least one special character';
                          }
                          return null;
                        },
          ),
          Padding(
            padding: const EdgeInsets.only(left: 12.0, top: 4.0, bottom: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Password requirements:',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '• At least 8 characters long',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor.withOpacity(0.7),
                  ),
                ),
                Text(
                  '• At least one uppercase letter (A-Z)',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor.withOpacity(0.7),
                  ),
                ),
                Text(
                  '• At least one lowercase letter (a-z)',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor.withOpacity(0.7),
                  ),
                ),
                Text(
                  '• At least one number (0-9)',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor.withOpacity(0.7),
                  ),
                ),
                Text(
                  '• At least one special character (! @ # % ^ & * etc.)',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondaryColor.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
                      const SizedBox(height: 20),
                      
                      // Confirm Password field
                      CustomTextField(
                        controller: _confirmPasswordController,
                        labelText: 'Confirm Password',
                        hintText: 'Confirm your password',
                        prefixIcon: Icons.lock_outline,
                        suffix: IconButton(
                          icon: Icon(
                            _obscureConfirmPassword ? Icons.visibility : Icons.visibility_off,
                            color: AppTheme.textSecondaryColor,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscureConfirmPassword = !_obscureConfirmPassword;
                            });
                          },
                        ),
                        isPassword: _obscureConfirmPassword,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please confirm your password';
                          }
                          if (value != _passwordController.text) {
                            return 'Passwords do not match';
                          }
                          return null;
                        },
          ),
                      const SizedBox(height: 24),
                      
                      // Terms and conditions
                      Row(
                        children: [
                          const Icon(
                            Icons.info_outline,
                            size: 16,
                            color: AppTheme.textSecondaryColor,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'By registering, you agree to our Terms of Service and Privacy Policy',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.textSecondaryColor.withOpacity(0.8),
                              ),
                            ),
                          ),
                        ],
          ),
                      const SizedBox(height: 24),
                      
                      // Register button
                      CustomButton(
                        text: 'Register',
                        isLoading: _isLoading,
                        onPressed: _register,
                      ),
          const SizedBox(height: 20),
                      
                      // Login link
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Already have an account?'),
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
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
} 