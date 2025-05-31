import 'package:flutter/material.dart';
import '../core/models/training_model.dart';
import '../core/theme/app_theme.dart';
import '../utils/formatters.dart';

class TrainingDetailCard extends StatelessWidget {
  final Training training;
  final bool isPast;
  final VoidCallback onClose;
  final VoidCallback onViewDetails;

  const TrainingDetailCard({
    Key? key,
    required this.training,
    required this.isPast,
    required this.onClose,
    required this.onViewDetails,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Check if training is truly in the past - for 2025 trainings, never show past message
    final now = DateTime.now();
    final oneYearFuture = now.add(const Duration(days: 365));
    
    // If the training starts far in the future (like 2025), it's definitely not past
    final bool isFutureTraining = training.startDate.isAfter(oneYearFuture);
    
    // Only show past message if explicitly set AND not a future training
    final shouldShowPastMessage = isPast && !isFutureTraining;
    
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
          maxWidth: MediaQuery.of(context).size.width * 0.9,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTrainingIcon(),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          training.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.visible,
                          softWrap: true,
                        ),
                        Text(
                          training.category,
                          style: TextStyle(
                            fontSize: 14,
                            color: _getCategoryColor(training.category),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildInfoSection('Status', _formatStatus(training.status),
                  color: _getStatusColor(training.status)),
              _buildInfoSection('Date', Formatters.formatDateRange(training.startDate, training.endDate)),
              _buildInfoSection('Location', training.location),
              _buildInfoSection(
                'Capacity',
                '${training.registered} registered out of ${training.capacity} available spots',
                isCapacity: true,
              ),
              if (training.instructorName != null)
                _buildInfoSection('Instructor', training.instructorName!),
              const SizedBox(height: 16),
              const Text(
                'Description',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                training.description,
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: onClose,
                    child: const Text('Close'),
                  ),
                  ElevatedButton(
                    onPressed: onViewDetails,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('View Details'),
                  ),
                ],
              ),
              
              // Show a past training message for completed trainings
              if (shouldShowPastMessage) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.history,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'This training has already ended',
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w500,
                          ),
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
    );
  }

  Widget _buildTrainingIcon() {
    IconData iconData;
    Color iconColor;

    switch (training.category.toLowerCase()) {
      case 'technical':
        iconData = Icons.build;
        iconColor = Colors.blue;
        break;
      case 'leadership':
        iconData = Icons.people;
        iconColor = Colors.green;
        break;
      case 'tactical':
        iconData = Icons.security;
        iconColor = Colors.red;
        break;
      case 'medical':
        iconData = Icons.medical_services;
        iconColor = Colors.orange;
        break;
      default:
        iconData = Icons.school;
        iconColor = Colors.purple;
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: iconColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        iconData,
        color: iconColor,
        size: 24,
      ),
    );
  }

  Widget _buildInfoSection(String title, String value, {Color? color, bool isCapacity = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          isCapacity
              ? _buildCapacityIndicator()
              : Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: color,
                    // Allow text to wrap to multiple lines
                    overflow: TextOverflow.visible,
                  ),
                  // Force text to wrap if needed
                  softWrap: true,
                ),
        ],
      ),
    );
  }

  Widget _buildCapacityIndicator() {
    final double progress = training.registered / training.capacity;
    final Color progressColor = progress < 0.7
        ? Colors.green
        : progress < 0.9
            ? Colors.orange
            : Colors.red;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${training.registered} registered out of ${training.capacity} available spots',
          style: const TextStyle(fontSize: 14),
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.grey[200],
            color: progressColor,
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  String _formatStatus(String status) {
    return status.toLowerCase().replaceFirst(status.substring(0, 1), status.substring(0, 1).toUpperCase());
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return Colors.green;
      case 'full':
        return Colors.red;
      case 'cancelled':
        return Colors.grey;
      case 'postponed':
        return Colors.orange;
      default:
        return Colors.blue;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'technical':
        return Colors.blue;
      case 'leadership':
        return Colors.green;
      case 'tactical':
        return Colors.red;
      case 'medical':
        return Colors.orange;
      default:
        return Colors.purple;
    }
  }
} 