import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:mongo_dart/mongo_dart.dart' as mongo;
import 'dart:math' as math;
import '../utils/formatters.dart';

import '../core/theme/app_theme.dart';
import '../core/services/auth_service.dart';
import '../core/services/training_service.dart';
import '../core/models/user_model.dart';
import '../core/models/training_model.dart';
import '../core/models/registered_personnel_model.dart';
import '../widgets/custom_appbar.dart';

class TrainingDetailsScreen extends StatefulWidget {
  final String? trainingId;
  final Training? training;
  
  const TrainingDetailsScreen({
    Key? key,
    this.trainingId,
    this.training,
  }) : super(key: key);

  @override
  State<TrainingDetailsScreen> createState() => _TrainingDetailsScreenState();
}

class _TrainingDetailsScreenState extends State<TrainingDetailsScreen> {
  late Future<Training?> _trainingFuture;
  late Future<User?> _userFuture;
  late Future<bool> _isRegisteredFuture;
  bool _isLoading = false;
  bool _isRegistered = false;
  String? _userId;
  
  // State variables for status messages
  bool _showSuccessMessage = false;
  String _successMessage = '';
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  // Helper method to extract valid hex string from ObjectId
  String _getValidHexString(mongo.ObjectId? objectId) {
    if (objectId == null) {
      throw Exception("ObjectId is null");
    }
    
    String idStr = objectId.toString();
    
    // If string contains "ObjectId(...)", extract just the hex part
    if (idStr.contains("ObjectId")) {
      final regex = RegExp(r'ObjectId\("([a-f0-9]{24})"\)');
      final match = regex.firstMatch(idStr);
      if (match != null && match.groupCount >= 1) {
        return match.group(1)!;
      } else {
        // Secondary pattern with different quotes or format
        final regex2 = RegExp(r'["\(]([a-f0-9]{24})["\)]');
        final match2 = regex2.firstMatch(idStr);
        if (match2 != null && match2.groupCount >= 1) {
          return match2.group(1)!;
        }
        throw Exception("Invalid ObjectId format: $idStr");
      }
    }
    
    // If we got here, try toHexString() method
    try {
      return objectId.toHexString();
    } catch (e) {
      // If all else fails, convert to string and remove any non-hex characters
      final cleanedStr = idStr.replaceAll(RegExp(r'[^a-f0-9]'), '');
      if (cleanedStr.length == 24) {
        return cleanedStr;
      }
      throw Exception("Cannot extract valid hex string from: $idStr");
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final trainingService = Provider.of<TrainingService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      
      _userFuture = authService.getCurrentUser();
      final user = await _userFuture;
      _userId = user?.id;
      print('DEBUG: Current user ID: $_userId');
      
      if (widget.training != null) {
        _trainingFuture = Future.value(widget.training);
      } else if (widget.trainingId != null) {
        _trainingFuture = trainingService.getTrainingById(widget.trainingId!);
      } else {
        // Handle case where no training info is provided
        _trainingFuture = Future.value(null);
      }
      
      final training = await _trainingFuture;
      print('DEBUG: Loaded training: ${training?.title}, ID: ${training?.id}');
      
      if (training != null && _userId != null && training.id != null) {
        try {
          // Use helper method to extract valid hex string
          final trainingIdStr = _getValidHexString(training.id);
          print('DEBUG: Checking registration with trainingId: $trainingIdStr');
          
          _isRegisteredFuture = trainingService.isUserRegistered(
            _userId!,
            trainingIdStr,
          );
          _isRegistered = await _isRegisteredFuture;
          print('DEBUG: User registration status: $_isRegistered');
        } catch (e) {
          print('Error checking registration status: $e');
          _isRegisteredFuture = Future.value(false);
          _isRegistered = false;
        }
      } else {
        _isRegisteredFuture = Future.value(false);
      }
    } catch (e) {
      print('Error loading training details: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GradientAppBar(
        title: 'Training Details',
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : FutureBuilder<Training?>(
            future: _trainingFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              
              if (snapshot.hasError) {
                return Center(
                  child: Text('Error: ${snapshot.error}'),
                );
              }
              
              final training = snapshot.data;
              if (training == null) {
                return const Center(
                  child: Text('Training not found'),
                );
              }
              
              return _buildTrainingDetails(training);
            },
          ),
    );
  }
  
  Widget _buildTrainingDetails(Training training) {
    // Use cached value instead of making a new request every time
    
    // Check if training is truly in the past regardless of the stored status
    final now = DateTime.now();
    final isPastTraining = training.endDate.isBefore(now);
    
    // Update training status if it's in the past but not marked as completed
    Training displayTraining = training;
    if (isPastTraining && training.status.toLowerCase() != 'completed') {
      displayTraining = training.copyWith(
        status: 'completed'
      );
    }
    
        return Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Training header card
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title and badge row
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                              displayTraining.title,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12, 
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                              color: _getStatusColor(displayTraining.status).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                              _formatStatus(displayTraining.status),
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                color: _getStatusColor(displayTraining.status),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 12),
                          
                          // Category
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8, 
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                          color: _getCategoryColor(displayTraining.category).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                          displayTraining.category.toUpperCase(),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                            color: _getCategoryColor(displayTraining.category),
                              ),
                            ),
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Date and time
                          _buildInfoRow(
                            Icons.calendar_today,
                            'Date & Time',
                        _formatDateRange(displayTraining.startDate, displayTraining.endDate),
                            Colors.blue,
                          ),
                          
                          const SizedBox(height: 12),
                          
                          // Location
                          _buildInfoRow(
                            Icons.location_on,
                            'Location',
                        displayTraining.location,
                            Colors.orange,
                          ),
                          
                          // Instructor
                      if (displayTraining.instructorName != null) ...[
                            const SizedBox(height: 12),
                            _buildInfoRow(
                              Icons.person,
                              'Instructor',
                          displayTraining.instructorName!,
                              Colors.purple,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Capacity section
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Capacity',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Capacity bar
                          Row(
                            children: [
                              Text(
                            '${displayTraining.registered}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: LinearProgressIndicator(
                                  value: displayTraining.registered / displayTraining.capacity,
                                      backgroundColor: Colors.grey.shade200,
                                  color: _getCapacityColor(displayTraining.registered, displayTraining.capacity),
                                      minHeight: 12,
                                    ),
                                  ),
                                ),
                              ),
                              Text(
                            '${displayTraining.capacity}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 12),
                          
                          // Availability info
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                            'Currently registered: ${displayTraining.registered}',
                                style: TextStyle(
                                  color: Colors.grey[700],
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                            displayTraining.isFull 
                                  ? 'No spots left' 
                              : '${displayTraining.capacity - displayTraining.registered} spots left',
                                style: TextStyle(
                              color: displayTraining.isFull ? Colors.red : Colors.green[700],
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          
                      if (displayTraining.isRequired) ...[
                            const SizedBox(height: 16),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.priority_high,
                                    color: Colors.red.shade700,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Mandatory Training',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.red.shade700,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'This training is required for your current position.',
                                          style: TextStyle(
                                            color: Colors.red.shade700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Description section
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Description',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          
                          const SizedBox(height: 16),
                          
                          Text(
                        displayTraining.description,
                            style: TextStyle(
                              fontSize: 16,
                              height: 1.5,
                              color: Colors.grey[800],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Registration button - only show for upcoming trainings
                  SizedBox(
                    width: double.infinity,
                child: isPastTraining || displayTraining.isCompleted 
                      ? Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                Icons.event_busy,
                                size: 28,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'This training has ended',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey[700],
                                ),
                                textAlign: TextAlign.center,
                              ),
                          if (_isRegistered) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'You were registered for this training',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[600],
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ],
                          ),
                        )
                  : _isRegistered
                        ? ElevatedButton(
                        onPressed: () => _cancelRegistration(displayTraining),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Cancel Registration',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          )
                        : ElevatedButton(
                        onPressed: displayTraining.isFull ? null : () => _registerForTraining(displayTraining),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                          displayTraining.isFull ? 'Training Full' : 'Register Now',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                  ),
                  
                  // Add padding at the bottom to ensure no content is hidden by the status bar
                  const SizedBox(height: 80),
                ],
                ),
              ),
            
            // Success message (shows temporarily)
            if (_showSuccessMessage)
              Positioned(
                bottom: 0, // Always at the bottom
                left: 0,
                right: 0,
                child: Container(
                  color: Colors.green,
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                  child: Text(
                    _successMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
    );
  }
  
  Widget _buildInfoRow(IconData icon, String label, String value, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: color,
            size: 24,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                ),
                softWrap: true,
                overflow: TextOverflow.visible,
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  String _formatStatus(String status) {
    // Convert status to a more user-friendly format
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'UPCOMING';
      case 'ongoing':
        return 'IN PROGRESS';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      case 'postponed':
        return 'POSTPONED';
      default:
        // Capitalize first letter of each word
        return status.split(' ').map((word) => 
          word.isNotEmpty 
            ? '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}'
            : ''
        ).join(' ');
    }
  }
  
  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return Colors.blue;
      case 'ongoing':
        return Colors.green;
      case 'completed':
        return Colors.grey.shade700;
      case 'cancelled':
        return Colors.red;
      case 'postponed':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }
  
  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'combat':
      case 'combat drill':
        return Colors.red;
      case 'leadership':
        return Colors.blue;
      case 'medical':
        return Colors.green;
      case 'technical':
        return Colors.orange;
      case 'communications':
        return Colors.purple;
      case 'intelligence':
        return Colors.indigo;
      case 'logistics':
        return Colors.brown;
      case 'seminar':
        return Colors.teal;
      default:
        return AppTheme.primaryColor;
    }
  }
  
  Color _getCapacityColor(int registered, int capacity) {
    final ratio = registered / capacity;
    if (ratio < 0.5) return Colors.green;
    if (ratio < 0.75) return Colors.orange;
    return Colors.red;
  }
  
  String _formatDateRange(DateTime start, DateTime end) {
    // Use the centralized formatter to ensure consistent display
    return Formatters.formatDateRange(start, end);
  }
  
  Future<void> _registerForTraining(Training training) async {
    try {
      setState(() {
        _isLoading = true;
        _showSuccessMessage = false; // Reset any previous success message
      });

      if (_userId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You must be logged in to register for trainings'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Make sure we have a valid training ID
      if (training.id == null) {
        throw Exception("Training ID is missing");
      }

      final trainingService = Provider.of<TrainingService>(context, listen: false);
      
      // Use helper method to get proper hex string
      final trainingIdStr = _getValidHexString(training.id);
      
      final success = await trainingService.registerForTraining(
        _userId!,
        trainingIdStr,
      );

      if (success && context.mounted) {
        // Update registration status immediately
        setState(() {
          _isRegistered = true;
          _successMessage = 'Successfully registered for ${training.title}';
          _showSuccessMessage = true;
          
          // Update training capacity directly in UI using copyWith
          _trainingFuture = Future.value(training.copyWith(
            registered: training.registered + 1
          ));
        });
        
        // Force refresh the user's training list to update the My Trainings tab
        if (_userId != null) {
          await trainingService.getUserTrainings(_userId!, forceRefresh: true);
        }
        
        // Show success message for a brief moment before closing
        await Future.delayed(const Duration(seconds: 2));
        
          if (mounted) {
          // Return to trainings screen and navigate to My Trainings tab
          Navigator.of(context).pop({'switchToMyTrainings': true});
          }
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to register for this training'),
            backgroundColor: Colors.red,
          ),
        );
        
        // Make sure we refresh the data anyway
        await _loadData();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to register: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      // Make sure we refresh the data in case of error
      if (mounted) {
        await _loadData();
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _cancelRegistration(Training training) async {
    // Add confirmation dialog
    final bool confirmCancel = await showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Cancel Registration'),
          content: Text('Are you sure you want to cancel your registration for "${training.title}"?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('No'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Yes'),
              style: TextButton.styleFrom(
                foregroundColor: Colors.red,
              ),
            ),
          ],
        );
      },
    ) ?? false;
    
    if (!confirmCancel) return;

    try {
      setState(() {
        _isLoading = true;
        _showSuccessMessage = false; // Reset any previous success message
      });

      if (_userId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You must be logged in to cancel registration'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Make sure we have a valid training ID
      if (training.id == null) {
        throw Exception("Training ID is missing");
      }

      final trainingService = Provider.of<TrainingService>(context, listen: false);
      
      // Use helper method to get proper hex string
      final trainingIdStr = _getValidHexString(training.id);
      
      final success = await trainingService.cancelRegistration(
        _userId!,
        trainingIdStr,
      );

      if (success && context.mounted) {
        // Update registration status immediately
        setState(() {
          _isRegistered = false;
          _successMessage = 'Registration canceled for ${training.title}';
          _showSuccessMessage = true;
          
          // Update training capacity directly in UI using copyWith
          _trainingFuture = Future.value(training.copyWith(
            registered: math.max(0, training.registered - 1)
          ));
        });
        
        // Reload the data in the background
        _loadData().then((_) {
          // Once data is reloaded, hide success message after a delay
          if (mounted) {
            Future.delayed(const Duration(seconds: 3), () {
              if (mounted) {
                setState(() {
                  _showSuccessMessage = false;
                });
              }
            });
          }
        });
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to cancel registration'),
            backgroundColor: Colors.red,
          ),
        );
        
        // Make sure we refresh the data anyway
        await _loadData();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to cancel registration: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
      
      // Make sure we refresh the data in case of error
      if (mounted) {
        await _loadData();
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
} 