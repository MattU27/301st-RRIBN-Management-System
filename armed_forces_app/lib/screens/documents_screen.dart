import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/theme/app_theme.dart';
import '../core/constants/app_constants.dart';
import '../models/document_model.dart';
import '../screens/home_screen.dart'; // Import for NotificationState

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({Key? key}) : super(key: key);

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;
  
  // Sample document data
  final List<Document> _documents = [
    Document(
      id: '1',
      userId: 'user123',
      title: 'ID Card',
      type: 'ID Card',
      fileUrl: 'https://example.com/documents/idcard.pdf',
      fileName: 'idcard.pdf',
      fileSize: 256000,
      mimeType: 'application/pdf',
      status: 'verified',
      securityClassification: 'Unclassified',
      uploadedAt: DateTime.now().subtract(const Duration(days: 100)),
      updatedAt: DateTime.now().subtract(const Duration(days: 90)),
      version: 1,
    ),
    Document(
      id: '2',
      userId: 'user123',
      title: 'Medical Certificate',
      type: 'Medical Certificate',
      description: 'Annual medical checkup certificate',
      fileUrl: 'https://example.com/documents/medical.pdf',
      fileName: 'medical_cert.pdf',
      fileSize: 512000,
      mimeType: 'application/pdf',
      status: 'verified',
      securityClassification: 'Unclassified',
      expirationDate: DateTime.now().add(const Duration(days: 265)),
      uploadedAt: DateTime.now().subtract(const Duration(days: 30)),
      updatedAt: DateTime.now().subtract(const Duration(days: 25)),
      version: 1,
    ),
    Document(
      id: '3',
      userId: 'user123',
      title: 'Training Certificate - Basic Combat',
      type: 'Training Certificate',
      fileUrl: 'https://example.com/documents/training.pdf',
      fileName: 'basic_combat_cert.pdf',
      fileSize: 384000,
      mimeType: 'application/pdf',
      status: 'pending',
      securityClassification: 'Unclassified',
      uploadedAt: DateTime.now().subtract(const Duration(days: 5)),
      updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      version: 1,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Documents'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          // Notification bell with badge
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications),
                onPressed: () {
                  _showNotificationsDialog(context);
                },
              ),
              if (NotificationState.unreadCount > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      NotificationState.unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Verified'),
            Tab(text: 'Pending'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDocumentsList(_documents),
          _buildDocumentsList(_documents.where((doc) => doc.isVerified).toList()),
          _buildDocumentsList(_documents.where((doc) => doc.isPending).toList()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _showUploadDocumentDialog();
        },
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.upload_file, color: Colors.white),
      ),
    );
  }

  Widget _buildDocumentsList(List<Document> documents) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (documents.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.description_outlined,
              size: 80,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            const Text(
              'No documents found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Upload your documents using the button below',
              style: TextStyle(color: AppTheme.textSecondaryColor),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                _showUploadDocumentDialog();
              },
              icon: const Icon(Icons.upload_file),
              label: const Text('Upload Document'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        // Implement refresh logic
        await Future.delayed(const Duration(seconds: 1));
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: documents.length,
        itemBuilder: (context, index) {
          return _buildDocumentCard(documents[index]);
        },
      ),
    );
  }

  Widget _buildDocumentCard(Document document) {
    final dateFormat = DateFormat('MMM dd, yyyy');
    
    Color statusColor;
    IconData statusIcon;
    String statusText;
    
    switch (document.status) {
      case 'verified':
        statusColor = AppTheme.successColor;
        statusIcon = Icons.check_circle;
        statusText = 'Verified';
        break;
      case 'pending':
        statusColor = AppTheme.warningColor;
        statusIcon = Icons.hourglass_empty;
        statusText = 'Pending';
        break;
      case 'rejected':
        statusColor = AppTheme.errorColor;
        statusIcon = Icons.cancel;
        statusText = 'Rejected';
        break;
      default:
        statusColor = AppTheme.textSecondaryColor;
        statusIcon = Icons.help;
        statusText = 'Unknown';
    }

    // Add an expired badge if the document is expired
    if (document.isExpired) {
      statusColor = AppTheme.errorColor;
      statusIcon = Icons.warning;
      statusText = 'Expired';
    }
    
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.cardRadius),
      ),
      child: InkWell(
        onTap: () {
          // View document details
        },
        borderRadius: BorderRadius.circular(AppConstants.cardRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _getDocumentTypeColor(document.type).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getDocumentTypeIcon(document.type),
                      color: _getDocumentTypeColor(document.type),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          document.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          document.fileName,
                          style: const TextStyle(
                            color: AppTheme.textSecondaryColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: statusColor),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          statusIcon,
                          size: 12,
                          color: statusColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (document.description != null) ...[
                Text(
                  document.description!,
                  style: const TextStyle(color: AppTheme.textSecondaryColor),
                ),
                const SizedBox(height: 8),
              ],
              _buildInfoRow(Icons.calendar_today, 'Uploaded: ${dateFormat.format(document.uploadedAt)}'),
              if (document.expirationDate != null) ...[
                const SizedBox(height: 4),
                _buildInfoRow(
                  Icons.event_busy,
                  'Expires: ${dateFormat.format(document.expirationDate!)}',
                  textColor: document.isExpired ? AppTheme.errorColor : null,
                ),
              ],
              const SizedBox(height: 4),
              _buildInfoRow(
                Icons.security,
                'Classification: ${document.securityClassification}',
                textColor: document.isConfidential ? AppTheme.militaryRed : null,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    onPressed: () {
                      // View document
                    },
                    icon: const Icon(Icons.remove_red_eye),
                    label: const Text('View'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                      side: BorderSide(color: AppTheme.primaryColor),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () {
                      // Download document
                    },
                    icon: const Icon(Icons.download),
                    label: const Text('Download'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text, {Color? textColor}) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: textColor ?? AppTheme.textSecondaryColor,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: textColor ?? AppTheme.textSecondaryColor,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }

  void _showUploadDocumentDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) {
          return SingleChildScrollView(
            controller: scrollController,
            child: Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Upload Document',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildUploadForm(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildUploadForm() {
    final TextEditingController titleController = TextEditingController();
    final TextEditingController descriptionController = TextEditingController();
    String? selectedDocumentType;
    String? selectedClassification = 'Unclassified';
    DateTime? expirationDate;
    
    return StatefulBuilder(
      builder: (context, setState) {
        return Form(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(AppConstants.buttonRadius),
                  border: Border.all(color: Colors.grey[400]!),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.cloud_upload,
                        size: 40,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () {
                          // Implement file picking
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Select File'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Document Type',
                  border: OutlineInputBorder(),
                ),
                value: selectedDocumentType,
                items: AppConstants.documentTypes.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    selectedDocumentType = value;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a document type';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description (Optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Security Classification',
                  border: OutlineInputBorder(),
                ),
                value: selectedClassification,
                items: AppConstants.securityClassifications.map((classification) {
                  return DropdownMenuItem(
                    value: classification,
                    child: Text(classification),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    selectedClassification = value;
                  });
                },
              ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: () async {
                  final DateTime? pickedDate = await showDatePicker(
                    context: context,
                    initialDate: expirationDate ?? DateTime.now().add(const Duration(days: 365)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 3650)),
                  );
                  if (pickedDate != null) {
                    setState(() {
                      expirationDate = pickedDate;
                    });
                  }
                },
                child: AbsorbPointer(
                  child: TextFormField(
                    decoration: const InputDecoration(
                      labelText: 'Expiration Date (Optional)',
                      border: OutlineInputBorder(),
                      suffixIcon: Icon(Icons.calendar_today),
                    ),
                    controller: TextEditingController(
                      text: expirationDate != null
                          ? DateFormat('yyyy-MM-dd').format(expirationDate!)
                          : '',
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    // Implement document upload
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Upload Document'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Color _getDocumentTypeColor(String type) {
    switch (type) {
      case 'ID Card':
        return AppTheme.primaryColor;
      case 'Medical Certificate':
        return AppTheme.successColor;
      case 'Training Certificate':
        return AppTheme.accentColor;
      case 'Deployment Order':
        return AppTheme.militaryGreen;
      case 'Commendation':
        return AppTheme.militaryRed;
      default:
        return AppTheme.secondaryColor;
    }
  }

  IconData _getDocumentTypeIcon(String type) {
    switch (type) {
      case 'ID Card':
        return Icons.badge;
      case 'Medical Certificate':
        return Icons.health_and_safety;
      case 'Training Certificate':
        return Icons.military_tech;
      case 'Deployment Order':
        return Icons.directions_walk;
      case 'Commendation':
        return Icons.stars;
      default:
        return Icons.description;
    }
  }

  // Add notification dialog method
  void _showNotificationsDialog(BuildContext context) {
    // Ensure we don't trigger navigation just by opening the notification drawer
    print('Opening notification dialog from DocumentsScreen - preventing navigation');
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      routeSettings: const RouteSettings(name: 'document_notifications_dialog'),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.7,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Notifications',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          // Mark all as read
                          NotificationState.markAllAsRead();
                          
                          // Update UI
                          setState(() {});
                          this.setState(() {});
                        },
                        child: const Text('Mark all as read'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: ListView.separated(
                      itemCount: NotificationState.announcements.length,
                      separatorBuilder: (context, index) => const Divider(),
                      itemBuilder: (context, index) {
                        final notification = NotificationState.announcements[index];
                        // Ensure isRead is always a boolean
                        final isRead = notification['isRead'] ?? false;
                        final isImportant = notification['isImportant'] ?? false;
                        
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isRead 
                              ? AppTheme.textSecondaryColor.withOpacity(0.2)
                              : AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                            child: Icon(
                              isImportant 
                                ? Icons.priority_high 
                                : Icons.notifications,
                            ),
                          ),
                          title: Text(
                            notification['title'] ?? 'No Title',
                            style: TextStyle(
                              fontWeight: isRead 
                                ? FontWeight.normal 
                                : FontWeight.bold,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                notification['content'] ?? 'No content',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notification['date'] != null 
                                  ? DateFormat('MMM d, yyyy').format(notification['date'])
                                  : 'No date',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textSecondaryColor,
                                ),
                              ),
                            ],
                          ),
                          onTap: () {
                            // Show notification details immediately in a dialog
                            _showNotificationDetailsInBottomSheet(
                              context, 
                              notification,
                              () {
                                // Mark as read when details are viewed
                                if (!isRead) {
                                  NotificationState.markAsRead(notification['id']);
                                  
                                  // Update UI
                                  setState(() {});
                                  this.setState(() {});
                                }
                              }
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
  
  // Show notification details directly in the bottom sheet
  void _showNotificationDetailsInBottomSheet(
    BuildContext context, 
    Map<String, dynamic> notification,
    VoidCallback onDetailsViewed
  ) {
    final hasNavigationTarget = notification['targetType'] != null && 
                               notification['targetType'] != 'notification';
    
    String actionButtonText = 'View Details';
    switch (notification['targetType']) {
      case 'training':
        actionButtonText = 'Go to Training';
        break;
      case 'document':
        actionButtonText = 'View Document';
        break;
      default:
        actionButtonText = 'View Details';
    }
    
    // Call the callback to mark as read
    onDetailsViewed();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(notification['title'] ?? 'Notification'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(notification['content'] ?? ''),
              const SizedBox(height: 16),
              Text(
                'Date: ${notification['date'] != null ? DateFormat('MMMM d, yyyy').format(notification['date']) : 'Unknown date'}',
                style: const TextStyle(
                  color: AppTheme.textSecondaryColor,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          if (hasNavigationTarget)
            ElevatedButton(
              onPressed: () {
                // Close the details dialog
                Navigator.pop(context);
                // Close the bottom sheet
                Navigator.pop(context);
                // Navigate to the target
                _navigateToTarget(notification['targetType'], notification['targetId']);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
              child: Text(actionButtonText),
            ),
        ],
      ),
    );
  }
  
  // Navigate to the target based on type and ID
  void _navigateToTarget(String targetType, String? targetId) {
    // First pop back to close any open dialogs (if any still open)
    if (Navigator.canPop(context)) {
      Navigator.of(context).pop();
    }
    
    // Create a map to store any parameters we want to pass
    final Map<String, dynamic> params = {
      'targetId': targetId,
    };
    
    // Navigate back to dashboard with the appropriate tab selected
    int tabIndex;
    switch (targetType) {
      case 'training':
        tabIndex = 1; // Trainings tab
        break;
      case 'document':
        tabIndex = 2; // Documents tab
        break;
      default:
        tabIndex = 0; // Home tab
    }
    
    // Use pushReplacementNamed to avoid building up the navigation stack
    Navigator.of(context).pushNamedAndRemoveUntil(
      '/dashboard',
      (route) => false,
      arguments: {
        'initialTabIndex': tabIndex,
        'params': params,
      },
    );
  }
} 