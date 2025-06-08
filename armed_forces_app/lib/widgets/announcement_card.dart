import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../core/models/announcement_model.dart';
import '../core/theme/app_theme.dart';

class AnnouncementCard extends StatelessWidget {
  final Announcement announcement;
  final VoidCallback? onTap;
  
  const AnnouncementCard({
    Key? key,
    required this.announcement,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, yyyy');
    final formattedDate = dateFormat.format(announcement.date);
    
    // Determine colors based on priority
    Color borderColor = Colors.transparent;
    Color badgeColor = AppTheme.accentColor;
    
    if (announcement.priority != null) {
      switch(announcement.priority) {
        case 'urgent':
          borderColor = Colors.red;
          badgeColor = Colors.red;
          break;
        case 'high':
          borderColor = Colors.orange;
          badgeColor = Colors.orange;
          break;
        case 'medium':
          borderColor = Colors.blue;
          badgeColor = Colors.blue;
          break;
        default:
          borderColor = announcement.isImportant ? AppTheme.accentColor : Colors.transparent;
          badgeColor = AppTheme.accentColor;
      }
    } else if (announcement.isImportant) {
      borderColor = AppTheme.accentColor;
      badgeColor = AppTheme.accentColor;
    }
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: (announcement.isImportant || announcement.priority != null)
            ? BorderSide(color: borderColor, width: 1.5)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // If there's an image, show it at the top
            if (announcement.imageUrl != null) ...[
              ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(10),
                  topRight: Radius.circular(10),
                ),
                child: CachedNetworkImage(
                  imageUrl: announcement.imageUrl!,
                  height: 150,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 150,
                    color: Colors.grey[300],
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 150,
                    color: Colors.grey[300],
                    child: const Icon(Icons.error),
                  ),
                ),
              ),
            ],
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title row with importance icon
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          announcement.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (announcement.isImportant || announcement.priority != null)
                        Icon(
                          Icons.priority_high,
                          color: badgeColor,
                          size: 20,
                        ),
                    ],
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Date
                  Text(
                    formattedDate,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Content preview (limit to 2 lines)
                  Text(
                    announcement.content,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[800],
                    ),
                  ),
                  
                  // If there's a document, show a link
                  if (announcement.documentUrl != null) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(
                          Icons.attach_file,
                          size: 16,
                          color: Colors.grey[600],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'View attachment',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
} 