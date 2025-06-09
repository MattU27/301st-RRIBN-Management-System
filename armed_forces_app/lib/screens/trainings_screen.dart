import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:table_calendar/table_calendar.dart';
import '../utils/formatters.dart';

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
  
  // Calendar variables
  CalendarFormat _calendarFormat = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  late Map<DateTime, List<Training>> _events;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this); // Added one more tab for calendar
    _tabController.addListener(_handleTabChange);
    _events = {};
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
      
      // Load events for calendar
      _loadCalendarEvents();
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
      
      // Refresh calendar events
      _loadCalendarEvents();
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
    
    // Check if user is registered for any past trainings and mark them as completed
    if (_userId != null) {
      _markPastTrainingsAsCompleted(trainingService, pastList);
    }
    
    // Make sure our modifications are visible
    trainingService.notifyListeners();
  }
  
  // Helper method to mark past trainings as completed
  void _markPastTrainingsAsCompleted(TrainingService trainingService, List<Training> pastTrainings) async {
    if (_userId == null) return;
    
    final now = DateTime.now();
    
    for (final training in pastTrainings) {
      try {
        // Check if this is a past training that the user was registered for
        if (training.endDate.isBefore(now)) {
          // Check if user is registered for this training
          final trainingIdStr = training.id?.toHexString() ?? '';
          if (trainingIdStr.isNotEmpty) {
            final isRegistered = await trainingService.isUserRegistered(_userId!, trainingIdStr);
            
            if (isRegistered) {
              print('DEBUG: Marking past training as completed: ${training.title}');
              // Mark as completed
              await trainingService.markTrainingAsCompleted(
                _userId!,
                trainingIdStr,
                score: 100.0, // Default score
              );
            }
          }
        }
      } catch (e) {
        print('Error marking training as completed: $e');
      }
    }
  }
  
  // Load events for calendar view
  void _loadCalendarEvents() {
    final trainingService = Provider.of<TrainingService>(context, listen: false);
    final allTrainings = [...trainingService.upcomingTrainings];
    
    // Add user trainings if available - only ones the user is actually registered for
    if (_userId != null) {
      final userTrainings = trainingService.getUserTrainingsCached(_userId!);
      if (userTrainings != null && userTrainings.isNotEmpty) {
        // Instead of blindly adding all user trainings, we'll do a background
        // verification of their registration status
        trainingService.getUserTrainings(_userId!, forceRefresh: true)
          .then((verifiedTrainings) {
            if (verifiedTrainings.isNotEmpty) {
              setState(() {
                // Update the training list with verified trainings
                for (final training in verifiedTrainings) {
                  // Only add if not already in the list
                  if (!allTrainings.any((t) => t.id?.toHexString() == training.id?.toHexString())) {
                    allTrainings.add(training);
                  }
                }
                
                // Rebuild events
                _buildCalendarEvents(allTrainings);
              });
            }
          });
      }
    }
    
    // Initial build of events map without waiting for verification
    _buildCalendarEvents(allTrainings);
  }
  
  // Helper method to build calendar events from trainings
  void _buildCalendarEvents(List<Training> allTrainings) {
    // Group trainings by date for calendar
    final Map<DateTime, List<Training>> eventMap = {};
    
    for (final training in allTrainings) {
      // Create normalized date (without time) for grouping
      final dateKey = DateTime(
        training.startDate.year,
        training.startDate.month,
        training.startDate.day,
      );
      
      if (!eventMap.containsKey(dateKey)) {
        eventMap[dateKey] = [];
      }
      
      // Only add if not already in the list
      if (!eventMap[dateKey]!.any((t) => t.id?.toHexString() == training.id?.toHexString())) {
        eventMap[dateKey]!.add(training);
      }
      
      // If training spans multiple days, add for each day in the range
      if (training.endDate.difference(training.startDate).inDays > 0) {
        final days = training.endDate.difference(training.startDate).inDays;
        for (var i = 1; i <= days; i++) {
          final date = training.startDate.add(Duration(days: i));
          final dayKey = DateTime(date.year, date.month, date.day);
          
          if (!eventMap.containsKey(dayKey)) {
            eventMap[dayKey] = [];
          }
          
          if (!eventMap[dayKey]!.any((t) => t.id?.toHexString() == training.id?.toHexString())) {
            eventMap[dayKey]!.add(training);
          }
        }
      }
    }
    
    setState(() {
      _events = eventMap;
      // Select today or the nearest day with events
      _selectedDay = _focusedDay;
      
      // If no events today, find the next day with events
      if (_events[_selectedDay] == null || _events[_selectedDay]!.isEmpty) {
        final sortedDates = eventMap.keys.toList()
          ..sort((a, b) => a.compareTo(b));
        
        // Find the next date with events after today
        final nextEventDate = sortedDates.firstWhere(
          (date) => date.isAfter(_focusedDay) || date.isAtSameMomentAs(_focusedDay),
          orElse: () => _focusedDay,
        );
        
        if (nextEventDate != _focusedDay) {
          _selectedDay = nextEventDate;
          _focusedDay = nextEventDate;
        }
      }
    });
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
          isScrollable: true,
          tabs: const [
            Tab(text: 'Available'),
            Tab(text: 'My Trainings'),
            Tab(text: 'Past'),
            Tab(icon: Icon(Icons.calendar_month), text: 'Calendar'),
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
                  _buildCalendarTab(),
                ],
              ),
            ),
    );
  }

  // New method to build the calendar tab
  Widget _buildCalendarTab() {
    return Column(
      children: [
        // Calendar header with view toggle
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Row(
            children: [
              const Text(
                'Training Schedule',
                style: TextStyle(
                  fontSize: 18, 
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              // Toggle view mode
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildViewToggleButton(
                      icon: Icons.calendar_month,
                      label: 'Calendar',
                      isSelected: _calendarFormat != CalendarFormat.twoWeeks,
                      onTap: () => setState(() {
                        _calendarFormat = CalendarFormat.month;
                      }),
                    ),
                    _buildViewToggleButton(
                      icon: Icons.list,
                      label: 'List',
                      isSelected: _calendarFormat == CalendarFormat.twoWeeks,
                      onTap: () => setState(() {
                        _calendarFormat = CalendarFormat.twoWeeks;
                      }),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Calendar view
        TableCalendar(
          firstDay: DateTime.now().subtract(const Duration(days: 365)),
          lastDay: DateTime.now().add(const Duration(days: 365)),
          focusedDay: _focusedDay,
          calendarFormat: _calendarFormat,
          selectedDayPredicate: (day) {
            return isSameDay(_selectedDay, day);
          },
          eventLoader: (day) {
            // Find events for this day
            final normalizedDay = DateTime(day.year, day.month, day.day);
            return _events[normalizedDay] ?? [];
          },
          onDaySelected: (selectedDay, focusedDay) {
            setState(() {
              _selectedDay = selectedDay;
              _focusedDay = focusedDay;
            });
          },
          onFormatChanged: (format) {
            setState(() {
              _calendarFormat = format;
            });
          },
          onPageChanged: (focusedDay) {
            _focusedDay = focusedDay;
          },
          calendarStyle: CalendarStyle(
            markersMaxCount: 3,
            markerDecoration: const BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
            ),
            todayDecoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            selectedDecoration: BoxDecoration(
              color: AppTheme.primaryColor,
              shape: BoxShape.circle,
            ),
            weekendTextStyle: const TextStyle(color: Colors.red),
            outsideDaysVisible: false,
          ),
          headerStyle: HeaderStyle(
            formatButtonVisible: false, // We're using our own toggle
            titleCentered: true,
            headerPadding: const EdgeInsets.symmetric(vertical: 8),
            leftChevronIcon: const Icon(Icons.chevron_left, color: AppTheme.primaryColor),
            rightChevronIcon: const Icon(Icons.chevron_right, color: AppTheme.primaryColor),
          ),
          calendarBuilders: CalendarBuilders(
            markerBuilder: (context, date, events) {
              if (events.isEmpty) return null;
              
              return Positioned(
                bottom: 1,
                child: Container(
                  width: events.length > 2 ? 16 : (events.length * 6),
                  height: 6,
                  decoration: BoxDecoration(
                    color: _getMarkerColor(events),
                    shape: BoxShape.rectangle,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            },
          ),
        ),
        
        // Date selector for list view mode (only shown in list mode)
        if (_calendarFormat == CalendarFormat.twoWeeks)
          _buildDateSelector(),
        
        // Divider between calendar and events
        const Divider(height: 1),
        
        // Header for events section
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: Row(
            children: [
              Text(
                _selectedDay != null 
                  ? 'Trainings on ${DateFormat('MMM d, yyyy').format(_selectedDay!)}'
                  : 'No date selected',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Text(
                _getEventCount(),
                style: TextStyle(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
        
        // Events list
        Expanded(
          child: _buildEventsForSelectedDay(),
        ),
      ],
    );
  }
  
  // Widget for date selector in list view mode
  Widget _buildDateSelector() {
    return Container(
      height: 80,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 14, // Show 2 weeks
        itemBuilder: (context, index) {
          final date = DateTime.now().add(Duration(days: index));
          final isSelected = _selectedDay != null && 
                            date.year == _selectedDay!.year &&
                            date.month == _selectedDay!.month &&
                            date.day == _selectedDay!.day;
          
          final hasEvents = _events[DateTime(date.year, date.month, date.day)]?.isNotEmpty ?? false;
          
          return InkWell(
            onTap: () {
              setState(() {
                _selectedDay = date;
                _focusedDay = date;
              });
            },
            child: Container(
              width: 60,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primaryColor : (hasEvents ? AppTheme.primaryColor.withOpacity(0.1) : Colors.transparent),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300,
                  width: 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    DateFormat('E').format(date).substring(0, 3),
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('d').format(date),
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : Colors.black,
                    ),
                  ),
                  if (hasEvents) ...[
                    const SizedBox(height: 4),
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.white : AppTheme.primaryColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
  
  // Widget for calendar/list view toggle button
  Widget _buildViewToggleButton({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.grey[600],
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? Colors.white : Colors.grey[600],
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  // Helper method to get event count text
  String _getEventCount() {
    if (_selectedDay == null) return '';
    
    final normalizedDay = DateTime(_selectedDay!.year, _selectedDay!.month, _selectedDay!.day);
    final events = _events[normalizedDay] ?? [];
    
    return events.isEmpty ? 'No trainings' : 
           events.length == 1 ? '1 training' : 
           '${events.length} trainings';
  }
  
  // Helper method to get marker color based on event type
  Color _getMarkerColor(List<dynamic> events) {
    // If any training is required/mandatory, use red
    if (events.any((event) => event is Training && event.isRequired)) {
      return Colors.red;
    }
    
    // If any training is in progress, use green
    if (events.any((event) => event is Training && event.status.toLowerCase() == 'ongoing')) {
      return Colors.green;
    }
    
    // Default color
    return AppTheme.primaryColor;
  }
  
  // Build events list for the selected day in calendar
  Widget _buildEventsForSelectedDay() {
    // If in List mode (two weeks), show a unified list of upcoming trainings
    if (_calendarFormat == CalendarFormat.twoWeeks) {
      return _buildUpcomingTrainingsList();
    }
    
    // Calendar mode - show trainings for selected day
    if (_selectedDay == null) {
      return const Center(
        child: Text('Select a day to view trainings'),
      );
    }

    final normalizedDay = DateTime(_selectedDay!.year, _selectedDay!.month, _selectedDay!.day);
    final events = _events[normalizedDay] ?? [];
    
    if (events.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No trainings scheduled for\n${DateFormat('MMM d, yyyy').format(_selectedDay!)}',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }
    
    return Consumer<TrainingService>(
      builder: (context, trainingService, child) {
        return FutureBuilder<Map<String, bool>>(
          future: _loadRegistrationStatuses(events),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            
            final registrationMap = snapshot.data ?? {};
            
            // Sort events by start time
            final sortedEvents = List<Training>.from(events)
              ..sort((a, b) => a.startDate.compareTo(b.startDate));
            
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: sortedEvents.length,
              itemBuilder: (context, index) {
                final training = sortedEvents[index];
                final isRegistered = registrationMap[training.id?.toHexString()] ?? false;
                
                // Use compact card for calendar view
                return _buildCompactTrainingCard(
                  training, 
                  isRegistered: isRegistered,
                );
              },
            );
          },
        );
      },
    );
  }
  
  // List view of upcoming trainings (used in list mode)
  Widget _buildUpcomingTrainingsList() {
    return Consumer<TrainingService>(
      builder: (context, trainingService, child) {
        final now = DateTime.now();
        // Get all upcoming trainings
        final allTrainings = [...trainingService.upcomingTrainings];
        
        // Add user registered trainings if available - will verify registration status
        List<Training> userTrainings = [];
        if (_userId != null) {
          final cachedUserTrainings = trainingService.getUserTrainingsCached(_userId!);
          if (cachedUserTrainings != null) {
            userTrainings = cachedUserTrainings;
          }
        }
        
        // Create a list of all trainings to check
        final combinedTrainings = <Training>[];
        combinedTrainings.addAll(allTrainings);
        for (final training in userTrainings) {
          if (!combinedTrainings.any((t) => t.id?.toHexString() == training.id?.toHexString())) {
            combinedTrainings.add(training);
          }
        }
        
        // Filter out past trainings
        var upcomingTrainings = combinedTrainings
            .where((t) => t.endDate.isAfter(now) && t.status.toLowerCase() != 'completed')
            .toList();
            
        // If in list mode with a selected day, filter to only show trainings for that day
        if (_selectedDay != null && _calendarFormat == CalendarFormat.twoWeeks) {
          final selectedDate = DateTime(_selectedDay!.year, _selectedDay!.month, _selectedDay!.day);
          upcomingTrainings = upcomingTrainings.where((training) {
            final trainingDate = DateTime(training.startDate.year, training.startDate.month, training.startDate.day);
            return trainingDate.isAtSameMomentAs(selectedDate);
          }).toList();
        }
        
        // Sort by date
        upcomingTrainings.sort((a, b) => a.startDate.compareTo(b.startDate));
        
        if (upcomingTrainings.isEmpty) {
          // In list mode with a selected day, show a specific message for that day
          if (_selectedDay != null && _calendarFormat == CalendarFormat.twoWeeks) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.event_busy,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No trainings scheduled for\n${DateFormat('MMM d, yyyy').format(_selectedDay!)}',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            );
          } else {
            return const Center(
              child: EmptyWidget(
                message: 'No upcoming trainings found',
                icon: Icons.event_busy,
              ),
            );
          }
        }
        
        return FutureBuilder<Map<String, bool>>(
          future: _loadRegistrationStatuses(upcomingTrainings),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            
            final registrationMap = snapshot.data ?? {};
            
            // Group trainings by month for better organization
            final groupedTrainings = _groupTrainingsByMonth(upcomingTrainings);
            
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: groupedTrainings.length,
              itemBuilder: (context, index) {
                final monthKey = groupedTrainings.keys.elementAt(index);
                final trainingsInMonth = groupedTrainings[monthKey]!;
                
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Month header
                    Padding(
                      padding: const EdgeInsets.only(left: 8, top: 16, bottom: 8),
                      child: Text(
                        monthKey,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                    // Trainings in this month
                    ...trainingsInMonth.map((training) {
                      final isRegistered = registrationMap[training.id?.toHexString()] ?? false;
                      return _buildTrainingCard(
                        training, 
                        isRegistered: isRegistered,
                        isPast: false,
                      );
                    }).toList(),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }
  
  // Helper to group trainings by month
  Map<String, List<Training>> _groupTrainingsByMonth(List<Training> trainings) {
    final Map<String, List<Training>> result = {};
    
    for (final training in trainings) {
      final monthKey = DateFormat('MMMM yyyy').format(training.startDate);
      
      if (!result.containsKey(monthKey)) {
        result[monthKey] = [];
      }
      
      result[monthKey]!.add(training);
    }
    
    return result;
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
            
            // Filter out trainings that the user is already registered for
            final availableTrainings = trainings.where((training) {
              final trainingId = training.id?.toHexString();
              return trainingId != null && !(registrationMap[trainingId] ?? false);
            }).toList();
            
            if (availableTrainings.isEmpty) {
              return const EmptyWidget(
                message: 'No available trainings found',
                icon: Icons.school,
              );
            }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
              itemCount: availableTrainings.length,
          itemBuilder: (context, index) {
                final training = availableTrainings[index];
                return _buildTrainingCard(training, isRegistered: false);
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

          return FutureBuilder<Map<String, bool>>(
            future: _loadRegistrationStatuses(userTrainings),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const LoadingWidget(message: 'Verifying registration status...');
              }
              
              final registrationMap = snapshot.data ?? {};
              
              // Only show trainings the user is actually registered for
              final verifiedTrainings = userTrainings.where((training) {
                final trainingId = training.id?.toHexString();
                return trainingId != null && (registrationMap[trainingId] ?? false);
              }).toList();
              
              if (verifiedTrainings.isEmpty) {
            return const EmptyWidget(
              message: 'You haven\'t registered for any current trainings',
              icon: Icons.school,
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
                itemCount: verifiedTrainings.length,
            itemBuilder: (context, index) {
                  final training = verifiedTrainings[index];
              return _buildTrainingCard(training, isRegistered: true);
                },
              );
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
            
            // Check for past trainings that need to be marked as completed
            _checkAndMarkCompletedTrainings(trainings, registrationMap);

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
  
  // Helper method to check and mark completed trainings
  void _checkAndMarkCompletedTrainings(List<Training> pastTrainings, Map<String, bool> registrationMap) async {
    if (_userId == null) return;
    
    final trainingService = Provider.of<TrainingService>(context, listen: false);
    
    for (final training in pastTrainings) {
      final trainingId = training.id?.toHexString();
      if (trainingId == null) continue;
      
      // Check if user was registered for this training
      final wasRegistered = registrationMap[trainingId] ?? false;
      
      // If user was registered and training is not already marked as completed
      if (wasRegistered && training.status.toLowerCase() != 'completed') {
        try {
          // Mark the training as completed for this user
          await trainingService.markTrainingAsCompleted(
            _userId!,
            trainingId,
            // Optional: Add a score if available
            score: 100.0, // Default score
          );
          
          print('DEBUG: Marked training ${training.title} as completed for user $_userId');
        } catch (e) {
          print('Error marking training as completed: $e');
        }
      }
    }
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
    // Use the centralized formatter to ensure consistent display
    return Formatters.formatDateRange(start, end);
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
        
        // Force refresh the user's trainings list to update the My Trainings tab
        if (_userId != null) {
          await trainingService.getUserTrainings(_userId!, forceRefresh: true);
        }
        
        // Switch to My Trainings tab to show the newly registered training
        _tabController.animateTo(1);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully registered for ${training.title}'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Refresh the training list after registration
        await _refreshTrainings();
        
        // Reload calendar events
        _loadCalendarEvents();
        
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
          await trainingService.getUserTrainings(_userId!, forceRefresh: true);
        }
        
        // Refresh the training list after canceling
        await _refreshTrainings();
        
        // Reload calendar events
        _loadCalendarEvents();
        
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

  void _navigateToTrainingDetails(Training training) {
    if (training.id != null) {
      Navigator.pushNamed(
        context,
        '/training-details',
        arguments: {
          'trainingId': training.id?.toHexString(),
          'training': training,
        },
      ).then((result) {
        // Handle navigation result
        if (result != null && result is Map<String, dynamic>) {
          // Check if we should switch to My Trainings tab
          if (result['switchToMyTrainings'] == true) {
            _tabController.animateTo(1); // Index 1 is My Trainings tab
          }
        }
      });
    }
  }

  // Build compact training card for calendar view
  Widget _buildCompactTrainingCard(Training training, {required bool isRegistered}) {
    final isPast = training.isCompleted || training.endDate.isBefore(DateTime.now());
    
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: training.isRequired 
            ? BorderSide(color: Colors.red.shade200, width: 1.5)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: () => _showTrainingDetails(training, isRegistered: isRegistered, isPast: isPast),
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Time indicator
              Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                                      Container(
                      width: 70,
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getCategoryColor(training.category).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                                          child: Text(
                        Formatters.formatTime(training.startDate),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _getCategoryColor(training.category),
                        ),
                      ),
                  ),
                  if (training.endDate.day == training.startDate.day) ...[
                    Container(
                      width: 1,
                      height: 20,
                      color: Colors.grey[300],
                    ),
                    Container(
                      width: 70,
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        Formatters.formatTime(training.endDate),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              
              const SizedBox(width: 12),
              
              // Training details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title and status
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            training.title,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isRegistered)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.green.shade100,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'Registered',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.green.shade800,
                              ),
                            ),
                          ),
                      ],
                    ),
                    
                    const SizedBox(height: 4),
                    
                    // Category
                    Text(
                      training.category,
                      style: TextStyle(
                        fontSize: 12,
                        color: _getCategoryColor(training.category),
                      ),
                    ),
                    
                    const SizedBox(height: 8),
                    
                    // Location
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          size: 12,
                          color: Colors.grey[600],
                        ),
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
                    
                    // Time range and multi-day indicator
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          constraints: const BoxConstraints(minWidth: 80),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            Formatters.formatTime(training.startDate) + 
                            (training.endDate.day == training.startDate.day ? 
                              ' - ' + Formatters.formatTime(training.endDate) : ''),
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.blue.shade800,
                            ),
                          ),
                        ),
                        
                        if (training.endDate.difference(training.startDate).inDays > 0) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.orange.shade50,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${training.endDate.difference(training.startDate).inDays + 1} day event',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.orange.shade800,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
} 