import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_theme.dart';
import '../core/constants/app_constants.dart';
import '../core/services/auth_service.dart';
import '../core/models/user_model.dart';
import './login_screen.dart';
import './home_screen.dart';
import './trainings_screen.dart';
import './documents_screen.dart';
import './profile_screen.dart';
import './policy_screen.dart';

class DashboardScreen extends StatefulWidget {
  final int initialTabIndex;
  final Map<String, dynamic>? params;
  
  const DashboardScreen({
    Key? key,
    this.initialTabIndex = 0,
    this.params,
  }) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> 
    with TickerProviderStateMixin {
  late int _currentIndex;
  late PageController _pageController;
  bool _showFloatingActionButton = true;
  bool _isLoading = true;
  User? _user;
  
  // Enhanced animation controllers
  late AnimationController _pageAnimationController;
  late AnimationController _fabAnimationController;
  late AnimationController _bottomNavAnimationController;
  
  // Individual page animations
  late List<AnimationController> _pageControllers;
  late List<Animation<double>> _pageOpacities;
  late List<Animation<Offset>> _pageSlides;
  late List<Animation<double>> _pageScales;

  final List<Widget> _screens = [
    const HomeScreen(),
    const TrainingsScreen(),
    const DocumentsScreen(),
    const PolicyScreen(),
    const ProfileScreen(),
  ];

  final List<String> _titles = [
    'Home',
    'Trainings',
    'Documents',
    'Policies',
    'Profile',
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTabIndex;
    _pageController = PageController(initialPage: _currentIndex);
    _showFloatingActionButton = _currentIndex < 2;
    
    _initializeAnimations();
    _loadUserData();
  }

  void _initializeAnimations() {
    // Main page transition controller
    _pageAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    // FAB animation controller
    _fabAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    // Bottom navigation animation controller
    _bottomNavAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    // Individual page controllers for staggered animations
    _pageControllers = List.generate(
      _screens.length, 
      (index) => AnimationController(
        vsync: this,
        duration: Duration(milliseconds: 500 + (index * 50)),
      ),
    );

    // Create animations for each page
    _pageOpacities = _pageControllers.map((controller) => 
      Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: controller,
          curve: const Interval(0.0, 0.8, curve: Curves.easeOutCubic),
        ),
      ),
    ).toList();

    _pageSlides = _pageControllers.map((controller) => 
      Tween<Offset>(
        begin: const Offset(0.0, 0.08),
        end: Offset.zero,
      ).animate(
        CurvedAnimation(
          parent: controller,
          curve: const Interval(0.2, 1.0, curve: Curves.easeOutCubic),
        ),
      ),
    ).toList();

    _pageScales = _pageControllers.map((controller) => 
      Tween<double>(begin: 0.95, end: 1.0).animate(
        CurvedAnimation(
          parent: controller,
          curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
        ),
      ),
    ).toList();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _pageAnimationController.dispose();
    _fabAnimationController.dispose();
    _bottomNavAnimationController.dispose();
    
    for (var controller in _pageControllers) {
      controller.dispose();
    }
    
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
      _showFloatingActionButton = index < 2;
    });
    
    // Animate FAB visibility
    if (index < 2) {
      _fabAnimationController.forward();
    } else {
      _fabAnimationController.reverse();
    }
    
    // Trigger page-specific animation
    _pageControllers[index].reset();
    _pageControllers[index].forward();
  }

  void _onItemTapped(int index) {
    if (_currentIndex != index) {
      // Animate bottom navigation
      _bottomNavAnimationController.forward().then((_) {
        _bottomNavAnimationController.reverse();
      });
      
      // Enhanced page transition
      _pageController.animateToPage(
        index,
        duration: const Duration(milliseconds: 700),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  Future<void> _loadUserData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final authService = AuthService();
      final user = await authService.getCurrentUser();

      if (user == null) {
        if (context.mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const LoginScreen()),
          );
        }
        return;
      }

      setState(() {
        _user = user;
        _isLoading = false;
      });
      
      // Start staggered animations
      _pageAnimationController.forward();
      _fabAnimationController.forward();
      
      // Animate current page
      await Future.delayed(const Duration(milliseconds: 200));
      _pageControllers[_currentIndex].forward();
      
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    if (!context.mounted) return;
    
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              'Logout',
              style: TextStyle(color: AppTheme.errorColor),
            ),
          ),
        ],
      ),
    );

    if (shouldLogout != true) return;
    
    // Show loading indicator with animation
    if (context.mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            content: Row(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                  ),
                ),
                const SizedBox(width: 16),
                const Text("Logging out..."),
              ],
            ),
          );
        },
      );
    }

    try {
      final authService = AuthService();
      await authService.logout();

      if (context.mounted) {
        Navigator.of(context).pop();
        Navigator.pushAndRemoveUntil(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => const LoginScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.0, 0.1),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                  )),
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 400),
            settings: const RouteSettings(name: '/login'),
          ),
          (route) => false,
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Logout failed: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      }
    }
  }

  Widget _buildAnimatedScreen(int index) {
    return AnimatedBuilder(
      animation: _pageControllers[index],
      builder: (context, child) {
        return FadeTransition(
          opacity: _pageOpacities[index],
          child: SlideTransition(
            position: _pageSlides[index],
            child: ScaleTransition(
              scale: _pageScales[index],
              child: _screens[index],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final isAdmin = authService.currentUser?.isAdmin ?? false;

    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 40,
                height: 40,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Loading...',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: PageView.builder(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        physics: const EnhancedPageViewScrollPhysics(),
        itemCount: _screens.length,
        itemBuilder: (context, index) => _buildAnimatedScreen(index),
      ),
      bottomNavigationBar: AnimatedBuilder(
        animation: _bottomNavAnimationController,
        builder: (context, child) {
          return Transform.scale(
            scale: 1.0 - (_bottomNavAnimationController.value * 0.02),
            child: Container(
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, -4),
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                child: NavigationBar(
                  selectedIndex: _currentIndex,
                  onDestinationSelected: _onItemTapped,
                  backgroundColor: Colors.white,
                  elevation: 0,
                  height: 65,
                  animationDuration: const Duration(milliseconds: 500),
                  labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
                  destinations: _titles.asMap().entries.map((entry) {
                    final index = entry.key;
                    final title = entry.value;
                    final isSelected = _currentIndex == index;
                    
                    return NavigationDestination(
                      icon: AnimatedScale(
                        scale: isSelected ? 1.2 : 1.0,
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOutBack,
                        child: _getIcon(index, false),
                      ),
                      selectedIcon: AnimatedScale(
                        scale: 1.2,
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOutBack,
                        child: _getIcon(index, true),
                      ),
                      label: title,
                    );
                  }).toList(),
                ),
              ),
            ),
          );
        },
      ),
      floatingActionButton: AnimatedBuilder(
        animation: _fabAnimationController,
        builder: (context, child) {
          if (!_showFloatingActionButton || !isAdmin) {
            return const SizedBox.shrink();
          }
          
          return Transform.scale(
            scale: _fabAnimationController.value,
            child: Transform.rotate(
              angle: (1 - _fabAnimationController.value) * 0.5,
              child: FloatingActionButton.extended(
                onPressed: () {
                  if (_currentIndex == 0) {
                    Navigator.pushNamed(context, '/create-announcement');
                  } else if (_currentIndex == 1) {
                    Navigator.pushNamed(context, '/create-training');
                  }
                },
                backgroundColor: AppTheme.primaryColor,
                elevation: 8,
                icon: const Icon(Icons.add, size: 20),
                label: Text(
                  _currentIndex == 0 ? 'Add Post' : 'Add Training',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ),
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _getIcon(int index, bool isSelected) {
    final icons = [
      isSelected ? Icons.home : Icons.home_outlined,
      isSelected ? Icons.school : Icons.school_outlined,
      isSelected ? Icons.description : Icons.description_outlined,
      isSelected ? Icons.policy : Icons.policy_outlined,
      isSelected ? Icons.person : Icons.person_outlined,
    ];
    
    return Icon(
      icons[index],
      color: isSelected ? AppTheme.primaryColor : Colors.grey[600],
    );
  }
}

// Enhanced scroll physics for ultra-smooth page transitions
class EnhancedPageViewScrollPhysics extends ScrollPhysics {
  const EnhancedPageViewScrollPhysics({ScrollPhysics? parent}) 
      : super(parent: parent);

  @override
  EnhancedPageViewScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return EnhancedPageViewScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 50,
        stiffness: 120,
        damping: 0.8,
      );

  @override
  double get dragStartDistanceMotionThreshold => 3.5;
}