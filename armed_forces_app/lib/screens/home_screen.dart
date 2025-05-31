import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../core/theme/app_theme.dart';
import '../core/services/auth_service.dart';
import '../core/services/announcement_service.dart';
import '../core/services/training_service.dart';
import '../core/models/user_model.dart';
import '../core/models/announcement_model.dart';
import '../core/models/training_model.dart';
import '../widgets/status_card.dart';
import '../widgets/custom_card.dart';
import '../widgets/custom_appbar.dart';
import '../core/widgets/error_widget.dart';
import '../core/widgets/loading_widget.dart';
import '../core/widgets/empty_widget.dart';
import '../widgets/announcement_card.dart';
import '../widgets/training_card.dart';
import '../widgets/training_detail_card.dart';

// Update NotificationState to be async and use the real database
class NotificationState {
  static List<Map<String, dynamic>> _notifications = [];
  static bool _isInitialized = false;
  
  static Future<void> initialize(List<Announcement> announcements) async {
    if (_isInitialized) return;
    
    _notifications = announcements.map((announcement) => {
      'id': announcement.id,
      'title': announcement.title,
      'content': announcement.content,
      'date': announcement.date,
      'isImportant': announcement.isImportant,
      'isRead': false,
      'targetType': announcement.targetType,
      'targetId': announcement.targetId,
    }).toList();
    
    _isInitialized = true;
  }
  
  static List<Map<String, dynamic>> get announcements => _notifications;
  
  static int get unreadCount {
    return _notifications.where((notification) => notification['isRead'] == false).length;
  }
  
  static void markAsRead(String id) {
    final notification = _notifications.firstWhere((n) => n['id'] == id, orElse: () => {});
    if (notification.isNotEmpty) {
      notification['isRead'] = true;
    }
  }
  
  static void markAllAsRead() {
    for (var notification in _notifications) {
      notification['isRead'] = true;
    }
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<User?> _userFuture;
  late Future<List<Announcement>> _announcementsFuture;
  late Future<List<Training>> _trainingsFuture;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    final authService = Provider.of<AuthService>(context, listen: false);
    final announcementService = Provider.of<AnnouncementService>(context, listen: false);
    final trainingService = Provider.of<TrainingService>(context, listen: false);

    _userFuture = authService.getCurrentUser();
    _announcementsFuture = announcementService.getAnnouncements();
    _trainingsFuture = trainingService.getUpcomingTrainings();
    
    // Initialize notification state with real announcements
    final announcements = await _announcementsFuture;
    await NotificationState.initialize(announcements);

    setState(() {
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : LayoutBuilder(
                builder: (context, constraints) {
                  return CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      _buildAppBar(),
                      _buildCompactBody(constraints),
                    ],
                  );
                },
              ),
      ),
    );
  }

  SliverAppBar _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 110.0,
      floating: false,
      pinned: true,
      automaticallyImplyLeading: false,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withOpacity(0.8),
              ],
            ),
          ),
        ),
        title: FutureBuilder<User?>(
          future: _userFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Text('Loading...');
            }
            if (snapshot.hasError || snapshot.data == null) {
              return const Text('Welcome');
            }
            
            final user = snapshot.data!;
            final now = DateTime.now();
            final hour = now.hour;
            
            String greeting;
            if (hour < 12) {
              greeting = 'Good Morning';
            } else if (hour < 17) {
              greeting = 'Good Afternoon';
            } else {
              greeting = 'Good Evening';
            }
            
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  greeting,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                Text(
                  '${user.firstName} ${user.lastName}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            );
          },
        ),
        centerTitle: false,
        titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
      ),
      actions: [
        IconButton(
          icon: Stack(
            children: [
              const Icon(Icons.notifications_outlined, size: 26),
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 14,
                    minHeight: 14,
                  ),
                  child: Text(
                    NotificationState.unreadCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ],
          ),
          onPressed: () {
            showDialog(
              context: context,
              builder: (BuildContext context) {
                return Dialog(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Container(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.7,
                      maxWidth: MediaQuery.of(context).size.width * 0.9,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(left: 16, right: 8, top: 16, bottom: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.notifications, color: AppTheme.primaryColor),
                              const SizedBox(width: 8),
                              const Text(
                                'Notifications',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const Spacer(),
                              TextButton(
                                onPressed: () {
                                  NotificationState.markAllAsRead();
                                  Navigator.of(context).pop();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('All notifications marked as read'),
                                      behavior: SnackBarBehavior.floating,
                                    ),
                                  );
                                  setState(() {}); // Refresh UI to update unread count
                                },
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  minimumSize: const Size(0, 36),
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text(
                                  'Mark all as read',
                                  style: TextStyle(fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Divider(height: 1),
                        Flexible(
                          child: NotificationState.announcements.isEmpty
                          ? const Center(
                              child: Padding(
                                padding: EdgeInsets.all(24.0),
                                child: Text('No notifications available'),
                              ),
                            )
                          : SingleChildScrollView(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: NotificationState.announcements.map((notification) {
                                return Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    ListTile(
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                      leading: Icon(
                                        notification['isImportant'] 
                                            ? Icons.circle_notifications 
                                            : Icons.notifications_none,
                                        color: notification['isImportant'] ? Colors.red : AppTheme.primaryColor,
                                        size: 24,
                                      ),
                                      title: Text(
                                        notification['title'],
                                        style: TextStyle(
                                          fontWeight: notification['isRead'] ? FontWeight.normal : FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      subtitle: Text(
                                        notification['content'],
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                      onTap: () {
                                        // Mark as read when tapped
                                        NotificationState.markAsRead(notification['id']);
                                        Navigator.of(context).pop();
                                        setState(() {}); // Refresh UI to update unread count
                                        
                                        // Show announcement details dialog
                                        showDialog(
                                          context: context,
                                          builder: (context) => AlertDialog(
                                            title: Text(notification['title']),
                                            content: SingleChildScrollView(
                                              child: Column(
                                                mainAxisSize: MainAxisSize.min,
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    DateFormat('MMMM d, yyyy').format(notification['date']),
                                                    style: TextStyle(
                                                      fontSize: 12, 
                                                      color: Colors.grey[600],
                                                      fontStyle: FontStyle.italic,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 16),
                                                  Text(notification['content']),
                                                ],
                                              ),
                                            ),
                                            actions: [
                                              TextButton(
                                                onPressed: () {
                                                  Navigator.of(context).pop();
                                                },
                                                child: const Text('Close'),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                    const Divider(height: 1),
                                  ],
                                );
                              }).toList(),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                          child: Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              child: const Text('Close'),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  SliverToBoxAdapter _buildCompactBody(BoxConstraints constraints) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            
            // Status Grid (more compact)
            _buildCompactStatusGrid(),
            
            const SizedBox(height: 12),

            // Quick Access Buttons
            _buildQuickAccessButtons(),

            const SizedBox(height: 12),
            
            // Content using tabbed layout to reduce scrolling
            _buildTabbedContent(),
            
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildCompactStatusGrid() {
    return FutureBuilder<User?>(
      future: _userFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            height: 100,
            child: Center(child: CircularProgressIndicator()),
          );
        }
        
        if (snapshot.hasError || snapshot.data == null) {
          return const SizedBox(
            height: 80,
            child: Center(child: Text('Failed to load status')),
          );
        }
        
        final user = snapshot.data!;
        
        return GridView.count(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          crossAxisCount: 4, // Increased from 2 to 4 for more compact layout
          childAspectRatio: 3.0, // Further increased to fix the vertical overflow on Pixel 7a
          crossAxisSpacing: 4, // Reduced from 8 to 4
          mainAxisSpacing: 4, // Reduced from 8 to 4
          padding: EdgeInsets.zero, // Remove default padding
          children: [
            StatusCard(
              title: 'Rank',
              value: user.rank,
              icon: Icons.military_tech,
              color: Colors.blue,
            ),
            StatusCard(
              title: 'SN',  // Shortened from "Serial"
              value: user.serialNumber,
              icon: Icons.badge,
              color: Colors.green,
            ),
            StatusCard(
              title: 'Unit',
              value: user.unit,
              icon: Icons.location_on,
              color: Colors.orange,
            ),
            StatusCard(
              title: 'Docs',
              value: '0',
              icon: Icons.description,
              color: Colors.purple,
            ),
          ],
        );
      },
    );
  }

  Widget _buildQuickAccessButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildQuickActionButton(
          icon: Icons.calendar_today, 
          label: 'Calendar',
          onTap: () {
            Navigator.pushNamed(context, '/calendar');
          }
        ),
        _buildQuickActionButton(
          icon: Icons.policy, 
          label: 'Policies',
          onTap: () {
            Navigator.pushNamed(context, '/policies');
          }
        ),
        _buildQuickActionButton(
          icon: Icons.badge, 
          label: 'ID Card',
          onTap: () {
            Navigator.pushNamed(context, '/id-card');
          }
        ),
        _buildQuickActionButton(
          icon: Icons.medical_services, 
          label: 'Medical',
          onTap: () {
            Navigator.pushNamed(context, '/medical');
          }
        ),
      ],
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 70,
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: AppTheme.primaryColor,
                size: 24,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.grey[800],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabbedContent() {
    return Container(
      height: 320, // Fixed height reduces layout shifts
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            spreadRadius: 1,
          ),
        ],
      ),
      child: DefaultTabController(
        length: 2,
        child: Column(
          children: [
            TabBar(
              labelColor: AppTheme.primaryColor,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppTheme.primaryColor,
              tabs: const [
                Tab(text: 'ANNOUNCEMENTS'),
                Tab(text: 'TRAININGS'),
              ],
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _buildAnnouncementsContent(),
                  _buildTrainingsContent(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnnouncementsContent() {
    return FutureBuilder<List<Announcement>>(
      future: _announcementsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        
        if (snapshot.hasError) {
          return Center(
            child: Text('Error: ${snapshot.error}', 
              style: const TextStyle(color: Colors.red),
            ),
          );
        }
        
        final announcements = snapshot.data ?? [];
        
        if (announcements.isEmpty) {
          return const Center(
            child: Text('No announcements available',
              style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey),
            ),
          );
        }
        
        // Sort by date (newest first) and importance
        announcements.sort((a, b) {
          // Sort by importance first
          if (a.isImportant && !b.isImportant) return -1;
          if (!a.isImportant && b.isImportant) return 1;
          
          // Then by date (newest first)
          return b.date.compareTo(a.date);
        });
        
        // Only show 2 recent announcements
        final recentAnnouncements = announcements.take(2).toList();
        
        return ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 100),
          child: ListView.builder(
            physics: const NeverScrollableScrollPhysics(),
            shrinkWrap: true,
            padding: EdgeInsets.zero,
            itemCount: recentAnnouncements.length,
            itemBuilder: (context, index) {
              final announcement = recentAnnouncements[index];
              return AnnouncementCard(
                announcement: announcement,
                onTap: () {
                  // Show detail dialog instead of navigating away
                  showDialog(
                    context: context,
                    barrierDismissible: true,
                    builder: (BuildContext context) {
                      return Dialog(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                        backgroundColor: Colors.transparent,
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (announcement.isImportant)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: const Text(
                                    'IMPORTANT',
                                    style: TextStyle(
                                      color: Colors.red,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              Text(
                                announcement.title,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                DateFormat('MMMM d, yyyy').format(announcement.date),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 16),
                              if (announcement.imageUrl != null) ...[
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: CachedNetworkImage(
                                    imageUrl: announcement.imageUrl!,
                                    fit: BoxFit.cover,
                                    height: 180,
                                    width: double.infinity,
                                    placeholder: (context, url) => const Center(
                                      child: CircularProgressIndicator(),
                                    ),
                                    errorWidget: (context, url, error) => 
                                      const Icon(Icons.error),
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],
                              Text(
                                announcement.content,
                                style: const TextStyle(fontSize: 14, height: 1.5),
                              ),
                              const SizedBox(height: 20),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                  child: Text(
                                    'Close',
                                    style: TextStyle(color: AppTheme.primaryColor),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildTrainingsContent() {
    return FutureBuilder<List<Training>>(
      future: _trainingsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            height: 100,
            child: Center(child: CircularProgressIndicator()),
          );
        }
        
        if (snapshot.hasError) {
          return const SizedBox(
            height: 100,
            child: Center(child: Text('Failed to load trainings')),
          );
        }
        
        final trainings = snapshot.data ?? [];
        
        if (trainings.isEmpty) {
          return const SizedBox(
            height: 100,
            child: Center(child: Text('No upcoming trainings')),
          );
        }
        
        // Only show 2 upcoming trainings
        final upcomingTrainings = trainings.take(2).toList();
        
        return ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 100),
          child: ListView.builder(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
            padding: EdgeInsets.zero,
          itemCount: upcomingTrainings.length,
          itemBuilder: (context, index) {
            final training = upcomingTrainings[index];
              return TrainingCard(
                training: training,
                onTap: () {
                  // Show detail dialog instead of navigating away
                  showDialog(
                    context: context,
                    barrierDismissible: true,
                    builder: (BuildContext context) {
                      return TrainingDetailCard(
                        training: training,
                        isPast: training.isCompleted,
                        onClose: () => Navigator.of(context).pop(),
                        onViewDetails: () {
                          Navigator.of(context).pop();
                          Navigator.pushNamed(
                            context,
                            '/training-details',
                            arguments: {
                              'trainingId': training.id?.toHexString(),
                              'training': training,
                            },
                          );
                        },
                      );
                    },
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  // Helper function to get color based on training status
  Color _getStatusColor(String status) {
    switch(status.toLowerCase()) {
      case 'upcoming':
        return Colors.blue;
      case 'in-progress':
        return Colors.green;
      case 'completed':
        return Colors.grey;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  // Helper function to format training date
  String _formatTrainingDate(DateTime startDate, DateTime endDate) {
    final dateFormat = DateFormat('MMM d, yyyy');
    final timeFormat = DateFormat('h:mm a');
    
    if (startDate.year == endDate.year && 
        startDate.month == endDate.month && 
        startDate.day == endDate.day) {
      // Same day event
      return '${dateFormat.format(startDate)} at ${timeFormat.format(startDate)}';
    } else {
      // Multi-day event
      return '${dateFormat.format(startDate)} - ${dateFormat.format(endDate)}';
    }
  }
} 