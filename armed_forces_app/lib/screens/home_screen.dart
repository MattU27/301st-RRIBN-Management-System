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

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late Future<User?> _userFuture;
  late Future<List<Announcement>> _announcementsFuture;
  late Future<List<Training>> _trainingsFuture;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _loadData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
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
    
    _animationController.forward();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryColor,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : FadeTransition(
                opacity: _fadeAnimation,
                child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                    _buildEnhancedAppBar(),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Quick Stats Section
                            _buildQuickStatsSection(),
                            
                            const SizedBox(height: 20),
                            
                            // Main Content
                            _buildMainContent(),
                            
                            const SizedBox(height: 20),
                    ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  SliverAppBar _buildEnhancedAppBar() {
    return SliverAppBar(
      expandedHeight: 120.0,
      floating: false,
      pinned: true,
      automaticallyImplyLeading: false,
      elevation: 0,
      backgroundColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withOpacity(0.8),
                AppTheme.primaryColor.withOpacity(0.9),
              ],
            ),
          ),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.1),
                  Colors.transparent,
                ],
              ),
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
            IconData greetingIcon;
            if (hour < 12) {
              greeting = 'Good Morning';
              greetingIcon = Icons.wb_sunny;
            } else if (hour < 17) {
              greeting = 'Good Afternoon';
              greetingIcon = Icons.wb_sunny_outlined;
            } else {
              greeting = 'Good Evening';
              greetingIcon = Icons.nights_stay;
            }
            
            return Row(
              children: [
                Icon(greetingIcon, size: 16, color: Colors.white70),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                        '$greeting,',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w400,
                          color: Colors.white70,
                  ),
                ),
                Text(
                        '${user.rank} ${user.lastName}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                          color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
        centerTitle: false,
        titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
      ),
      actions: [
        _buildNotificationButton(),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildNotificationButton() {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: IconButton(
          icon: Stack(
            children: [
            const Icon(Icons.notifications_outlined, size: 24, color: Colors.white),
            if (NotificationState.unreadCount > 0)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    NotificationState.unreadCount > 99 ? '99+' : NotificationState.unreadCount.toString(),
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
        onPressed: () => _showNotificationsDialog(),
      ),
    );
  }

  Widget _buildQuickStatsSection() {
    return FutureBuilder<User?>(
      future: _userFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildSkeletonStats();
        }
        
        if (snapshot.hasError || snapshot.data == null) {
          return const SizedBox.shrink();
        }
        
        final user = snapshot.data!;
        
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.dashboard_outlined, color: AppTheme.primaryColor, size: 20),
                  const SizedBox(width: 8),
                  const Text(
                    'Quick Overview',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      title: 'Rank',
                      value: user.rank,
                      icon: Icons.military_tech,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      title: 'Serial Number',
                      value: user.serialNumber,
                      icon: Icons.badge,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      title: 'Unit',
                      value: user.unit,
                      icon: Icons.group,
                      color: Colors.orange,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      title: 'Documents',
                      value: '0',
                      icon: Icons.description,
                      color: Colors.purple,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
        ],
      ),
    );
  }

  Widget _buildSkeletonStats() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            height: 20,
            width: 120,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: List.generate(2, (index) => Expanded(
              child: Container(
                margin: EdgeInsets.only(right: index == 0 ? 12 : 0),
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            )),
          ),
          const SizedBox(height: 12),
          Row(
            children: List.generate(2, (index) => Expanded(
              child: Container(
                margin: EdgeInsets.only(right: index == 0 ? 12 : 0),
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            )),
          ),
        ],
      ),
    );
  }

  void _showNotificationsDialog() {
            showDialog(
              context: context,
              builder: (BuildContext context) {
                return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Container(
                    constraints: BoxConstraints(
                      maxHeight: MediaQuery.of(context).size.height * 0.7,
                      maxWidth: MediaQuery.of(context).size.width * 0.9,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.1),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                    ),
                  ),
                          child: Row(
                            children: [
                      Icon(Icons.notifications, color: AppTheme.primaryColor),
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
                          setState(() {});
                                },
                                style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                        child: Text(
                                  'Mark all as read',
                          style: TextStyle(
                            color: AppTheme.primaryColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Flexible(
                          child: NotificationState.announcements.isEmpty
                      ? _buildEmptyState(
                          icon: Icons.notifications_off_outlined,
                          title: 'No Notifications',
                          subtitle: 'You have no new notifications',
                            )
                      : ListView.builder(
                          padding: EdgeInsets.zero,
                          itemCount: NotificationState.announcements.length,
                          itemBuilder: (context, index) {
                            final notification = NotificationState.announcements[index];
                                return Column(
                                  children: [
                                    ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: notification['isImportant']
                                          ? Colors.red.withOpacity(0.1)
                                          : AppTheme.primaryColor.withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                        notification['isImportant'] 
                                          ? Icons.priority_high
                                            : Icons.notifications_none,
                                      color: notification['isImportant']
                                          ? Colors.red
                                          : AppTheme.primaryColor,
                                      size: 20,
                                    ),
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
                                  subtitle: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                        notification['content'],
                                                    style: TextStyle(
                                                      fontSize: 12, 
                                                      color: Colors.grey[600],
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        DateFormat('MMM d, yyyy').format(notification['date']),
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.grey[500],
                                                      fontStyle: FontStyle.italic,
                                                    ),
                                                  ),
                                    ],
                                  ),
                                  onTap: () {
                                    NotificationState.markAsRead(notification['id']);
                                                  Navigator.of(context).pop();
                                    setState(() {});
                                    
                                    _showAnnouncementDetails(Announcement(
                                      id: notification['id'],
                                      title: notification['title'],
                                      content: notification['content'],
                                      date: notification['date'],
                                      isImportant: notification['isImportant'],
                                      targetType: notification['targetType'],
                                      targetId: notification['targetId'],
                                    ));
                                  },
                                              ),
                                if (index < NotificationState.announcements.length - 1)
                                  Divider(height: 1, color: Colors.grey[200]),
                              ],
                                        );
                                      },
                                    ),
                            ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(color: Colors.grey[200]!),
                          ),
                        ),
                            child: TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: TextButton.styleFrom(
                      backgroundColor: Colors.grey[100],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      minimumSize: const Size(double.infinity, 40),
                    ),
                              child: const Text('Close'),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
  }

  Widget _buildMainContent() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
          // Tab header
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: DefaultTabController(
              length: 2,
              child: Column(
                children: [
                  TabBar(
                    labelColor: AppTheme.primaryColor,
                    unselectedLabelColor: Colors.grey[600],
                    indicatorColor: AppTheme.primaryColor,
                    indicatorWeight: 3,
                    indicatorSize: TabBarIndicatorSize.label,
                    labelStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                    tabs: const [
                      Tab(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.campaign, size: 16),
                            SizedBox(width: 6),
                            Text('ANNOUNCEMENTS'),
                          ],
                        ),
                      ),
                      Tab(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.school, size: 16),
                            SizedBox(width: 6),
                            Text('TRAININGS'),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(
                    height: 400,
                    child: TabBarView(
                      children: [
                        _buildAnnouncementsTab(),
                        _buildTrainingsTab(),
          ],
        ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Split the announcement content into a separate widget to avoid context issues
  Widget _buildAnnouncementsTab() {
    return FutureBuilder<List<Announcement>>(
      future: _announcementsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildLoadingList();
        }
        
        if (snapshot.hasError) {
          return _buildErrorState('Failed to load announcements');
        }
        
        final announcements = snapshot.data ?? [];
        
        if (announcements.isEmpty) {
          return _buildEmptyState(
            icon: Icons.campaign_outlined,
            title: 'No Announcements',
            subtitle: 'Check back later for updates',
          );
        }
        
        // Sort by date (newest first) and importance
        announcements.sort((a, b) {
          if (a.isImportant && !b.isImportant) return -1;
          if (!a.isImportant && b.isImportant) return 1;
          return b.date.compareTo(a.date);
        });
        
        final recentAnnouncements = announcements.take(5).toList();
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: recentAnnouncements.length,
          itemBuilder: (context, index) {
            final announcement = recentAnnouncements[index];
            return _buildEnhancedAnnouncementCard(announcement, index);
          },
        );
      },
    );
  }

  // Split the training content into a separate widget to avoid context issues
  Widget _buildTrainingsTab() {
    return FutureBuilder<List<Training>>(
      future: _trainingsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _buildLoadingList();
        }
        
        if (snapshot.hasError) {
          return _buildErrorState('Failed to load trainings');
        }
        
        final trainings = snapshot.data ?? [];
        
        if (trainings.isEmpty) {
          return _buildEmptyState(
            icon: Icons.school_outlined,
            title: 'No Trainings',
            subtitle: 'No upcoming trainings scheduled',
          );
          }
        
        final upcomingTrainings = trainings.take(5).toList();
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: upcomingTrainings.length,
          itemBuilder: (context, index) {
            final training = upcomingTrainings[index];
            return _buildEnhancedTrainingCard(training, index);
          },
        );
      },
    );
  }

  Widget _buildEnhancedAnnouncementCard(Announcement announcement, int index) {
    // Check if the announcement is important/urgent based on priority field
    final isUrgent = announcement.isImportant || 
                     (announcement.priority != null && 
                      (announcement.priority == 'urgent' || announcement.priority == 'high'));
    
    // Determine the badge text based on priority
    String badgeText = 'URGENT';
    Color badgeBgColor = Colors.red.withOpacity(0.1);
    Color badgeTextColor = Colors.red;
    bool showBadge = isUrgent;
    
    if (announcement.priority != null) {
      showBadge = true;
      switch(announcement.priority) {
        case 'urgent':
          badgeText = 'URGENT';
          badgeBgColor = Colors.red.withOpacity(0.1);
          badgeTextColor = Colors.red;
          break;
        case 'high':
          badgeText = 'HIGH PRIORITY';
          badgeBgColor = Colors.orange.withOpacity(0.1);
          badgeTextColor = Colors.orange.shade800;
          break;
        case 'medium':
          badgeText = 'MEDIUM';
          badgeBgColor = Colors.blue.withOpacity(0.1);
          badgeTextColor = Colors.blue.shade800;
          break;
        case 'low':
          badgeText = 'LOW';
          badgeBgColor = Colors.grey.withOpacity(0.1);
          badgeTextColor = Colors.grey.shade800;
          break;
        default:
          showBadge = isUrgent;
          break;
      }
    }
    
    // Set card background color based on priority
    Color cardBgColor = Colors.white;
    Color borderColor = Colors.grey.withOpacity(0.2);
    
    if (announcement.priority != null) {
      switch(announcement.priority) {
        case 'urgent':
          cardBgColor = Colors.red.withOpacity(0.05);
          borderColor = Colors.red.withOpacity(0.3);
          break;
        case 'high':
          cardBgColor = Colors.orange.withOpacity(0.05);
          borderColor = Colors.orange.withOpacity(0.3);
          break;
        case 'medium':
          cardBgColor = Colors.blue.withOpacity(0.05);
          borderColor = Colors.blue.withOpacity(0.3);
          break;
        case 'low':
          cardBgColor = Colors.white;
          borderColor = Colors.grey.withOpacity(0.2);
          break;
      }
    } else if (announcement.isImportant) {
      cardBgColor = Colors.red.withOpacity(0.05);
      borderColor = Colors.red.withOpacity(0.3);
    }
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
      borderRadius: BorderRadius.circular(12),
          onTap: () => _showAnnouncementDetails(announcement),
      child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: borderColor,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 5,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
        child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
          children: [
                Row(
                  children: [
                    if (showBadge) ...[
            Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                          color: badgeBgColor,
                borderRadius: BorderRadius.circular(12),
              ),
                        child: Text(
                          badgeText,
                          style: TextStyle(
                            color: badgeTextColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: Text(
                        announcement.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(
                      Icons.chevron_right,
                      color: Colors.grey[400],
                      size: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
            Text(
                  announcement.content,
              style: TextStyle(
                fontSize: 12,
                    color: Colors.grey[600],
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  DateFormat('MMM d, yyyy').format(announcement.date),
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEnhancedTrainingCard(Training training, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _showTrainingDetails(training),
          child: Container(
            padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _getStatusColor(training.status).withOpacity(0.3),
              ),
        boxShadow: [
          BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 5,
                  offset: const Offset(0, 1),
          ),
        ],
      ),
        child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
          children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(training.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        training.status.toUpperCase(),
                        style: TextStyle(
                          color: _getStatusColor(training.status),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Spacer(),
                    Icon(
                      Icons.chevron_right,
                      color: Colors.grey[400],
                      size: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  training.title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  training.description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                children: [
                    Icon(Icons.calendar_today, size: 12, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      _formatTrainingDate(training.startDate, training.endDate),
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 12, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        _getLocationName(training),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[500],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getLocationName(Training training) {
    try {
      // First try to access as a map
      if (training.location is Map && (training.location as Map).containsKey('name')) {
        return (training.location as Map)['name'] as String;
      }
      // If location is a String, return it directly
      if (training.location is String) {
        return training.location as String;
      }
      // Fallback
      return 'Location not specified';
    } catch (e) {
      return 'Location not specified';
        }
  }

  Widget _buildLoadingList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 100,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
            ),
          );
      },
    );
  }

  Widget _buildErrorState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadData,
            child: const Text('Retry'),
          ),
        ],
            ),
          );
        }
        
  void _showAnnouncementDetails(Announcement announcement) {
    final isUrgent = announcement.isImportant || 
                     (announcement.priority != null && 
                      (announcement.priority == 'urgent' || announcement.priority == 'high'));
    
    // Determine the badge text based on priority
    String badgeText = 'IMPORTANT';
    if (announcement.priority != null) {
      if (announcement.priority == 'high') {
        badgeText = 'HIGH PRIORITY';
      } else if (announcement.priority == 'urgent') {
        badgeText = 'URGENT';
      } else if (announcement.priority == 'medium') {
        badgeText = 'MEDIUM PRIORITY';
      } else if (announcement.priority == 'low') {
        badgeText = 'LOW PRIORITY';
      }
    }
    
    // Set badge color based on priority
    Color badgeBgColor = Colors.red.withOpacity(0.1);
    Color badgeTextColor = Colors.red;
    
    if (announcement.priority != null) {
      switch(announcement.priority) {
        case 'urgent':
          badgeBgColor = Colors.red.withOpacity(0.1);
          badgeTextColor = Colors.red;
          break;
        case 'high':
          badgeBgColor = Colors.orange.withOpacity(0.1);
          badgeTextColor = Colors.orange.shade800;
          break;
        case 'medium':
          badgeBgColor = Colors.blue.withOpacity(0.1);
          badgeTextColor = Colors.blue.shade800;
          break;
        case 'low':
          badgeBgColor = Colors.grey.withOpacity(0.1);
          badgeTextColor = Colors.grey.shade800;
          break;
      }
    }
                      
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
                if (isUrgent || announcement.priority != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                      color: badgeBgColor,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                    child: Text(
                      badgeText,
                                    style: TextStyle(
                        color: badgeTextColor,
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
  }

  void _showTrainingDetails(Training training) {
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

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 14, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
} 