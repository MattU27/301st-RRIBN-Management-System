import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../core/theme/app_theme.dart';
import '../core/services/auth_service.dart';
import '../core/services/training_service.dart';
import '../core/models/user_model.dart';
import '../core/models/training_model.dart';
import '../widgets/custom_appbar.dart';
import '../widgets/training_card.dart';
import '../core/widgets/loading_widget.dart';
import '../core/widgets/error_widget.dart';
import '../core/widgets/empty_widget.dart';
import '../widgets/training_detail_card.dart';

class TrainingsScreen extends StatefulWidget {
  const TrainingsScreen({Key? key}) : super(key: key);

  @override
  State<TrainingsScreen> createState() => _TrainingsScreenState();
}

class _TrainingsScreenState extends State<TrainingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late Future<User?> _userFuture;
  bool _isLoading = true;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_handleTabChange);
    _loadUserData();
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    super.dispose();
  }

  void _handleTabChange() {
    // When tab changes, force refresh to ensure trainings are in the correct tabs
    if (_tabController.indexIsChanging) {
      // If switching to My Trainings tab (index 1), refresh user trainings
      if (_tabController.index == 1 && _userId != null) {
        final trainingService = Provider.of<TrainingService>(context, listen: false);
        trainingService.getUserTrainings(_userId!);
      }
      
      setState(() {});
    }
  }

  Future<void> _loadUserData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final trainingService = Provider.of<TrainingService>(context, listen: false);
      
      _userFuture = authService.getCurrentUser();
      
      // Get user ID for training service
      final user = await _userFuture;
      _userId = user?.id;
      
      // Refresh trainings data
      await _refreshTrainings();
      
      // Pre-load user trainings if we have a userId
      if (_userId != null) {
        await trainingService.getUserTrainings(_userId!);
      }
    } catch (e) {
      print('Error loading user data: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _refreshTrainings() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final trainingService = Provider.of<TrainingService>(context, listen: false);
      
      // Load trainings for all tabs
      await trainingService.getUpcomingTrainings();
      
      await trainingService.getPastTrainings();
      
      // Load user trainings if we have a user ID and they're not already loaded
      if (_userId != null && trainingService.getUserTrainingsCached(_userId!) == null) {
        await trainingService.getUserTrainings(_userId!);
      }
      
      // Force a check of all trainings to ensure they're in the right categories
      _updateTrainingsCategories(trainingService);
    } catch (e) {
      print('Error refreshing trainings: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  // Helper method to ensure trainings are in the correct categories
  void _updateTrainingsCategories(TrainingService trainingService) {
    final now = DateTime.now();
    final upcomingList = List<Training>.from(trainingService.upcomingTrainings);
    final pastList = List<Training>.from(trainingService.pastTrainings);
    
    // Check if any "upcoming" trainings should actually be in "past"
    for (final training in upcomingList) {
      // Consider trainings as "past" if:
      // 1. The end date is before now
      // 2. The status is 'completed'
      if (training.endDate.isBefore(now) || 
          training.status.toLowerCase() == 'completed') {
        
        print('DEBUG: Moving training to past - ${training.title}');
        
        // Add to past if not already there
        if (!pastList.any((t) => t.id?.toHexString() == training.id?.toHexString())) {
          pastList.add(training);
        }
        
        // Remove from upcoming
        trainingService.upcomingTrainings.removeWhere(
            (t) => t.id?.toHexString() == training.id?.toHexString());
      }
    }
    
    // Make sure our modifications are visible
    trainingService.notifyListeners();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GradientAppBar(
        title: 'Trainings',
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Available'),
            Tab(text: 'My Trainings'),
            Tab(text: 'Past'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // Show notifications
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refreshTrainings,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildAvailableTrainingsTab(),
                  _buildMyTrainingsTab(),
                  _buildPastTrainingsTab(),
                ],
              ),
            ),
    );
  }

  Widget _buildAvailableTrainingsTab() {
    return Consumer<TrainingService>(
      builder: (context, trainingService, child) {
        final now = DateTime.now();
        // Filter out any trainings that have end dates in the past
        final trainings = trainingService.upcomingTrainings
            .where((training) => 
                training.endDate.isAfter(now) && // End date must be in the future
                training.status.toLowerCase() != 'completed' // Status must not be completed
            )
            .toList();
        
        if (_isLoading) {
          return const LoadingWidget(message: 'Loading available trainings...');
        }

        if (trainings.isEmpty) {
          return const EmptyWidget(
            message: 'No available trainings found',
            icon: Icons.school,
          );
        }

        // Load all registration statuses at once to avoid multiple calls
        return FutureBuilder<Map<String, bool>>(
          future: _loadRegistrationStatuses(trainings),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingWidget(message: 'Loading registration status...');
            }
            
            final registrationMap = snapshot.data ?? {};

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: trainings.length,
          itemBuilder: (context, index) {
            final training = trainings[index];
                final isRegistered = registrationMap[training.id?.toHexString()] ?? false;
                return _buildTrainingCard(training, isRegistered: isRegistered);
              },
            );
          }
        );
      },
    );
  }

  Widget _buildMyTrainingsTab() {
    if (_userId == null) {
      return const Center(
        child: Text('Please log in to view your trainings'),
      );
    }
    
    return Consumer<TrainingService>(
      builder: (context, trainingService, child) {
        if (_isLoading) {
          return const LoadingWidget(message: 'Loading your trainings...');
        }

        // Get cached trainings if available
        final userTrainings = trainingService.getUserTrainingsCached(_userId!);
        
        if (userTrainings == null) {
          // Load trainings if not in cache
        return FutureBuilder<List<Training>>(
          future: trainingService.getUserTrainings(_userId!),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingWidget(message: 'Loading your trainings...');
            }
            
            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        color: Colors.red,
                        size: 60,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Failed to load your trainings',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }
            
            final trainings = snapshot.data ?? [];
            
            if (trainings.isEmpty) {
              return const EmptyWidget(
                  message: 'You haven\'t registered for any current trainings',
                icon: Icons.school,
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: trainings.length,
              itemBuilder: (context, index) {
                final training = trainings[index];
                return _buildTrainingCard(training, isRegistered: true);
              },
            );
          },
        );
        } else {
          // Use cached data
          if (userTrainings.isEmpty) {
            return const EmptyWidget(
              message: 'You haven\'t registered for any current trainings',
              icon: Icons.school,
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: userTrainings.length,
            itemBuilder: (context, index) {
              final training = userTrainings[index];
              return _buildTrainingCard(training, isRegistered: true);
            },
          );
        }
      },
    );
  }

  Widget _buildPastTrainingsTab() {
    return Consumer<TrainingService>(
      builder: (context, trainingService, child) {
        final now = DateTime.now();
        // Get all past trainings
        final trainings = trainingService.pastTrainings
            .where((training) => 
                training.endDate.isBefore(now) || 
                training.status.toLowerCase() == 'completed')
            .toList();
        
        if (_isLoading) {
          return const LoadingWidget(message: 'Loading past trainings...');
        }

        if (trainings.isEmpty) {
          return const EmptyWidget(
            message: 'No past trainings found',
            icon: Icons.school,
          );
        }

        // Load all registration statuses at once to avoid multiple calls
        return FutureBuilder<Map<String, bool>>(
          future: _loadRegistrationStatuses(trainings),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingWidget(message: 'Loading registration status...');
            }
            
            final registrationMap = snapshot.data ?? {};

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: trainings.length,
          itemBuilder: (context, index) {
            final training = trainings[index];
                final isRegistered = registrationMap[training.id?.toHexString()] ?? false;
                return _buildTrainingCard(training, isRegistered: isRegistered, isPast: true);
              },
            );
          }
        );
      },
    );
  }
  
  // Helper method to load all registration statuses at once
  Future<Map<String, bool>> _loadRegistrationStatuses(List<Training> trainings) async {
    if (_userId == null) return {};
    
    final Map<String, bool> result = {};
    final trainingService = Provider.of<TrainingService>(context, listen: false);
    
    try {
      // Batch process to avoid too many independent calls
      for (final training in trainings) {
        if (training.id != null) {
          final trainingId = training.id!.toHexString();
          // Check if we've already got this training's status
          if (!result.containsKey(trainingId)) {
            final isRegistered = await trainingService.isUserRegistered(
              _userId!,
              trainingId,
            );
            result[trainingId] = isRegistered;
          }
        }
      }
    } catch (e) {
      print('Error loading registration statuses: $e');
    }
    
    return result;
  }

  Widget _buildTrainingCard(
    Training training, {
    bool isRegistered = false,
    bool isPast = false,
  }) {
    // Check if training is truly in the past
    final now = DateTime.now();
    final isTrainingPast = training.status.toLowerCase() == 'completed' || 
                          (training.endDate.isBefore(now) && 
                           !training.startDate.isAfter(now.add(const Duration(days: 365))));
                           
    // Only force isPast to true for trainings that are actually in the past
    isPast = isPast || isTrainingPast;

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _showTrainingDetails(training, isRegistered: isRegistered, isPast: isPast),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTrainingIcon(training),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                training.title,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (training.isRequired)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade100,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Text(
                                  'Mandatory',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        Text(
                          training.category,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                training.description,
                style: const TextStyle(fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    _formatDateRange(training.startDate, training.endDate),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      training.location,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.group, size: 14, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Capacity: ${training.registered}/${training.capacity}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: training.registered / training.capacity,
                  backgroundColor: Colors.grey.shade200,
                  color: _getProgressColor(training.registered / training.capacity),
                  minHeight: 8,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(isPast ? 'completed' : training.status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      isPast ? 'PAST' : _formatStatus(training.status),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: _getStatusColor(isPast ? 'completed' : training.status),
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () => _showTrainingDetails(training, isRegistered: isRegistered, isPast: isPast),
                        child: const Text('Details'),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                      _buildActionButton(training, isRegistered, isPast),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrainingIcon(Training training) {
    final IconData icon = _getTrainingIcon(training.category);
    final Color color = _getCategoryColor(training.category);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        icon,
        color: color,
        size: 24,
      ),
    );
  }

  IconData _getTrainingIcon(String category) {
    switch (category.toLowerCase()) {
      case 'combat':
        return Icons.security;
      case 'leadership':
        return Icons.groups;
      case 'medical':
        return Icons.medical_services;
      case 'technical':
        return Icons.build;
      case 'communications':
        return Icons.send;
      case 'intelligence':
        return Icons.psychology;
      case 'logistics':
        return Icons.local_shipping;
      default:
        return Icons.school;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'combat':
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
      default:
        return AppTheme.primaryColor;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return Colors.blue;
      case 'ongoing':
        return Colors.green;
      case 'completed':
        return Colors.grey;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  Color _getProgressColor(double progress) {
    if (progress < 0.3) return Colors.green;
    if (progress < 0.7) return Colors.orange;
    return Colors.red;
  }

  String _formatStatus(String status) {
    return status.toUpperCase();
  }

  String _formatDateRange(DateTime start, DateTime end) {
    final DateFormat dateFormat = DateFormat('MMM d, yyyy');
    
    if (start.year == end.year && start.month == end.month && start.day == end.day) {
      return '${dateFormat.format(start)} (1 day)';
    } else {
      final Duration duration = end.difference(start);
      final int days = duration.inDays + 1;
      return '${dateFormat.format(start)} - ${dateFormat.format(end)} ($days days)';
    }
  }

  Future<void> _showTrainingDetails(
    Training training, {
    bool isRegistered = false,
    bool isPast = false,
  }) async {
    // Check if training is truly in the past
    final now = DateTime.now();
    final isTrainingPast = training.status.toLowerCase() == 'completed' || 
                          (training.endDate.isBefore(now) && 
                           !training.startDate.isAfter(now.add(const Duration(days: 365))));
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return TrainingDetailCard(
          training: training,
          isPast: isPast || isTrainingPast,
          onClose: () => Navigator.of(context).pop(),
          onViewDetails: () {
            Navigator.of(context).pop();
            _navigateToTrainingDetails(training);
          },
        );
      },
    );
  }

  Widget _buildInfoSection(String label, String value, {Color? color, bool isCapacity = false, Training? training}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 80,
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[600],
                  ),
                ),
              ),
              Expanded(
                child: Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: color,
                    fontWeight: color != null ? FontWeight.bold : null,
                  ),
                  softWrap: true,
                  overflow: TextOverflow.visible,
                  maxLines: 3,
                ),
              ),
            ],
          ),
          if (isCapacity && training != null) ...[
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: training.registered / training.capacity,
                backgroundColor: Colors.grey.shade200,
                color: _getCapacityColor(training.registered, training.capacity),
                minHeight: 10,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "${training.registered} registered",
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  "${training.capacity - training.registered} spots left",
                  style: TextStyle(
                    fontSize: 12,
                    color: training.isFull ? Colors.red : Colors.green[700],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Color _getCapacityColor(int registered, int capacity) {
    final ratio = registered / capacity;
    if (ratio < 0.5) return Colors.green;
    if (ratio < 0.75) return Colors.orange;
    return Colors.red;
  }

  Future<bool> _checkIfUserRegistered(Training training) async {
    if (training.id == null || _userId == null) return false;
    
    try {
      final trainingService = Provider.of<TrainingService>(context, listen: false);
      // Reuse the same method that now has internal caching
      return await trainingService.isUserRegistered(
        _userId!,
        training.id!.toHexString(),
      );
    } catch (e) {
      print('Error checking registration status: $e');
      return false;
    }
  }

  Future<void> _registerForTraining(Training training) async {
    try {
      setState(() {
        _isLoading = true;
      });

      final user = await _userFuture;
      if (user == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You must be logged in to register for trainings'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      final trainingService = Provider.of<TrainingService>(context, listen: false);
      final success = await trainingService.registerForTraining(
        user.id,
        training.id!.toHexString(),
      );

      if (success && context.mounted) {
        // Update UI immediately to reflect registration
        setState(() {
          // Update capacity in local UI
          final index = trainingService.upcomingTrainings.indexWhere((t) => t.id == training.id);
          if (index != -1) {
            // Create a new updated training with increased capacity
            final updatedTraining = trainingService.upcomingTrainings[index].copyWith(
              registered: trainingService.upcomingTrainings[index].registered + 1
            );
            
            // Update the list with the new training
            trainingService.upcomingTrainings[index] = updatedTraining;
          }
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully registered for ${training.title}'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Refresh the training list after registration
        await _refreshTrainings();
        
        // Add this to force re-render
        if (mounted) {
          setState(() {});
        }
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You are already registered for this training'),
            backgroundColor: Colors.orange,
          ),
        );
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
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildActionButton(Training training, bool isRegistered, bool isPast) {
    // Check if training is truly in the past
    final now = DateTime.now();
    final isTrainingPast = training.status.toLowerCase() == 'completed' || 
                          (training.endDate.isBefore(now) && 
                           !training.startDate.isAfter(now.add(const Duration(days: 365))));
                           
    // Use our custom logic instead of training.isCompleted
    if (isPast || isTrainingPast) {
      // For past trainings, show a "View Only" badge instead of no button
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Text(
          'Past Training',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.grey[600],
          ),
        ),
      );
    }
    
    if (isRegistered) {
      return ElevatedButton(
        onPressed: () async {
          await _cancelRegistration(training);
          // Force UI rebuild with updated registration status
          setState(() {});
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: const Text('Cancel'),
      );
    }
    
    if (training.isFull) {
      return ElevatedButton(
        onPressed: null, // Disabled button
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.grey,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: const Text('Full'),
      );
    }
    
    return ElevatedButton(
      onPressed: () async {
        await _registerForTraining(training);
        // Force UI rebuild with updated registration status
        setState(() {});
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      child: const Text('Register'),
    );
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
      });

      final user = await _userFuture;
      if (user == null) {
        return;
      }

      final trainingService = Provider.of<TrainingService>(context, listen: false);
      final success = await trainingService.cancelRegistration(
        user.id,
        training.id!.toHexString(),
      );

      if (success && context.mounted) {
        // Update UI immediately to reflect cancellation
        setState(() {
          // Update capacity in local UI
          final index = trainingService.upcomingTrainings.indexWhere((t) => t.id == training.id);
          if (index != -1 && trainingService.upcomingTrainings[index].registered > 0) {
            // Create a new updated training with decreased capacity
            final updatedTraining = trainingService.upcomingTrainings[index].copyWith(
              registered: trainingService.upcomingTrainings[index].registered - 1
            );
            
            // Update the list with the new training
            trainingService.upcomingTrainings[index] = updatedTraining;
          }
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registration canceled for ${training.title}'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Force refresh the user trainings list to ensure it's updated in the My Trainings tab
        if (_userId != null) {
          await trainingService.getUserTrainings(_userId!);
        }
        
        // Refresh the training list after canceling
        await _refreshTrainings();
        
        // Force UI to update
        if (mounted) {
          setState(() {});
        }
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to cancel registration'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _navigateToTrainingDetails(Training training) {
    if (training.id != null) {
      Navigator.pushNamed(
        context,
        '/training-details',
        arguments: {
          'trainingId': training.id?.toHexString(),
          'training': training,
        },
      );
    }
  }
} 