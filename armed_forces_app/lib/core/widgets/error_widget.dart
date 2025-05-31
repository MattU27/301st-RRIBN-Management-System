import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

// Rename to CustomErrorWidget to avoid conflict with Flutter's ErrorWidget
class CustomErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final IconData icon;
  
  const CustomErrorWidget({
    Key? key,
    required this.message,
    required this.onRetry,
    this.icon = Icons.error_outline,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Network error specific widget
class NetworkErrorWidget extends StatelessWidget {
  final VoidCallback onRetry;
  
  const NetworkErrorWidget({
    Key? key,
    required this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CustomErrorWidget(
      icon: Icons.wifi_off,
      message: 'Network connection error. Please check your internet connection and try again.',
      onRetry: onRetry,
    );
  }
}

// Server error specific widget
class ServerErrorWidget extends StatelessWidget {
  final VoidCallback onRetry;
  
  const ServerErrorWidget({
    Key? key,
    required this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CustomErrorWidget(
      icon: Icons.cloud_off,
      message: 'Server error. Our team has been notified and is working on the issue.',
      onRetry: onRetry,
    );
  }
} 