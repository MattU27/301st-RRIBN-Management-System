import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class EmptyWidget extends StatelessWidget {
  final String message;
  final String? buttonText;
  final VoidCallback? onButtonPressed;
  final IconData icon;
  
  const EmptyWidget({
    Key? key,
    required this.message,
    this.buttonText,
    this.onButtonPressed,
    this.icon = Icons.inbox,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: Colors.grey[400],
              size: 80,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            if (buttonText != null && onButtonPressed != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onButtonPressed,
                style: ElevatedButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(buttonText!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// Specialized empty widgets for different contexts
class EmptyAnnouncementsWidget extends StatelessWidget {
  final VoidCallback? onButtonPressed;
  
  const EmptyAnnouncementsWidget({
    Key? key,
    this.onButtonPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyWidget(
      message: 'No announcements available',
      icon: Icons.campaign,
      buttonText: onButtonPressed != null ? 'Check Later' : null,
      onButtonPressed: onButtonPressed,
    );
  }
}

class EmptyTrainingsWidget extends StatelessWidget {
  final VoidCallback? onButtonPressed;
  
  const EmptyTrainingsWidget({
    Key? key,
    this.onButtonPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyWidget(
      message: 'No training sessions available',
      icon: Icons.school,
      buttonText: onButtonPressed != null ? 'Check Later' : null,
      onButtonPressed: onButtonPressed,
    );
  }
}

class EmptyDocumentsWidget extends StatelessWidget {
  final VoidCallback? onButtonPressed;
  
  const EmptyDocumentsWidget({
    Key? key,
    this.onButtonPressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return EmptyWidget(
      message: 'No documents available',
      icon: Icons.description,
      buttonText: onButtonPressed != null ? 'Upload Document' : null,
      onButtonPressed: onButtonPressed,
    );
  }
} 