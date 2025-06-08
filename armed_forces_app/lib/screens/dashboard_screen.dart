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

class _DashboardScreenState extends State<DashboardScreen> {
  late int _currentIndex;
  late PageController _pageController;
  bool _showFloatingActionButton = true;
  bool _isLoading = true;
  User? _user;

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
    _loadUserData();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentIndex = index;
      // Only show FAB on home and trainings screens (index 0 and 1)
      _showFloatingActionButton = index < 2;
    });
  }

  void _onItemTapped(int index) {
    // Smooth animation between pages
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
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
    } catch (e) {
      // Handle error
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
    
    // Show loading indicator
    if (context.mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return const AlertDialog(
            content: Row(
              children: [
                CircularProgressIndicator(),
                SizedBox(width: 16),
                Text("Logging out..."),
              ],
            ),
          );
        },
      );
    }

    try {
      final authService = AuthService();
      await authService.logout();

      // Close the loading dialog and navigate to login
      if (context.mounted) {
        Navigator.of(context).pop(); // Remove loading dialog
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      // Close the loading dialog and show error
      if (context.mounted) {
        Navigator.of(context).pop(); // Remove loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Logout failed: ${e.toString()}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final isAdmin = authService.currentUser?.isAdmin ?? false;

    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: _onPageChanged,
        physics: const NeverScrollableScrollPhysics(),
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: _onItemTapped,
          backgroundColor: Colors.white,
          elevation: 0,
          height: 60,
          animationDuration: const Duration(milliseconds: 400),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: _titles[0],
            ),
            NavigationDestination(
              icon: const Icon(Icons.school_outlined),
              selectedIcon: const Icon(Icons.school),
              label: _titles[1],
            ),
            NavigationDestination(
              icon: const Icon(Icons.description_outlined),
              selectedIcon: const Icon(Icons.description),
              label: _titles[2],
            ),
            NavigationDestination(
              icon: const Icon(Icons.policy_outlined),
              selectedIcon: const Icon(Icons.policy),
              label: _titles[3],
            ),
            NavigationDestination(
              icon: const Icon(Icons.person_outlined),
              selectedIcon: const Icon(Icons.person),
              label: _titles[4],
            ),
          ],
        ),
      ),
      floatingActionButton: _showFloatingActionButton && isAdmin
          ? FloatingActionButton(
              onPressed: () {
                if (_currentIndex == 0) {
                  Navigator.pushNamed(context, '/create-announcement');
                } else if (_currentIndex == 1) {
                  Navigator.pushNamed(context, '/create-training');
                }
              },
              backgroundColor: AppTheme.primaryColor,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
} 