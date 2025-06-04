import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:path/path.dart' as path;
import 'dart:convert';
import '../core/theme/app_theme.dart';
import '../core/constants/app_constants.dart';
import '../models/document_model.dart';
import '../screens/home_screen.dart'; // Import for NotificationState
import '../services/document_service.dart'; // Import the document service
import '../services/socket_service.dart'; // Import the socket service

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({Key? key}) : super(key: key);

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<Document> _documents = [];
  final DocumentService _documentService = DocumentService();
  final SocketService _socketService = SocketService();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _initializeSocket();
    _fetchDocuments();
  }

  Future<void> _initializeSocket() async {
    try {
      await _socketService.initSocket();
      print('Socket initialized in DocumentsScreen: ${_socketService.isConnected ? 'connected' : 'not connected'}');
    } catch (e) {
      print('Error initializing socket: $e');
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchDocuments() async {
    setState(() {
      _isLoading = true;
    });

    try {
      print('Fetching documents from service...');
      final documents = await _documentService.getUserDocuments();
      print('Fetched ${documents.length} documents');
      
      if (documents.isNotEmpty) {
        print('First document: ${documents.first.title}');
      }
      
      setState(() {
        _documents = documents;
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching documents: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading documents: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
      setState(() {
        _isLoading = false;
      });
    }
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
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _fetchDocuments();
            },
          ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              _showRequiredDocumentsInfo(context);
            },
          ),
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
        await _fetchDocuments();
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
        child: Padding(
        padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
              crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                // Document type icon
                  Container(
                  width: 40,
                  height: 40,
                    decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(4),
                    ),
                    child: Icon(
                      _getDocumentTypeIcon(document.type),
                      color: _getDocumentTypeColor(document.type),
                    size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                
                // Document title and filename
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
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _getDisplayDocumentType(document.type),
                          style: TextStyle(
                            color: _getDocumentTypeColor(document.type),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                
                // Status badge
                  Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor),
                    ),
                  child: Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                    ),
                  ),
                ],
              ),
            
            // Description if available
            if (document.description != null && document.description!.isNotEmpty) ...[
              const SizedBox(height: 12),
                Text(
                  document.description!,
                style: TextStyle(color: Colors.grey[700]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                ),
            ],
            
            // Upload date
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 14, color: Colors.grey[600]),
                const SizedBox(width: 6),
                Text(
                  'Uploaded: ${dateFormat.format(document.uploadedAt)}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
            
            // Action buttons
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                  onPressed: () => _viewDocument(document),
                  icon: const Icon(Icons.visibility, size: 18),
                    label: const Text('View'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                      side: BorderSide(color: AppTheme.primaryColor),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                  onPressed: () => _downloadDocument(document),
                  icon: const Icon(Icons.download, size: 18),
                    label: const Text('Download'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                  ),
                ],
              ),
            ],
        ),
      ),
    );
  }

  void _showUploadDocumentDialog({String? preselectedDocType}) {
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
                  _buildUploadForm(preselectedDocType: preselectedDocType),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildUploadForm({String? preselectedDocType}) {
    final TextEditingController titleController = TextEditingController();
    final TextEditingController descriptionController = TextEditingController();
    String? selectedDocumentType = preselectedDocType;
    String? selectedFileName;
    int? selectedFileSize;
    bool isUploading = false;
    PlatformFile? pickedFile;
    
    // If preselected document type is provided, set the title as well
    if (preselectedDocType != null) {
      titleController.text = preselectedDocType;
    }
    
    return StatefulBuilder(
      builder: (context, setState) {
        return Form(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: () async {
                  try {
                    // Use file_picker to select files
                    FilePickerResult? result = await FilePicker.platform.pickFiles(
                      type: FileType.custom,
                      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
                      allowMultiple: false,
                    );
                    
                    if (result != null && result.files.isNotEmpty) {
                      final file = result.files.first;
                      setState(() {
                        selectedFileName = file.name;
                        selectedFileSize = file.size;
                        pickedFile = file;
                      });
                    }
                  } catch (e) {
                    print('Error picking file: $e');
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Error selecting file. Please try again.'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                },
                child: Container(
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
                        if (selectedFileName != null)
                          Column(
                            children: [
                              const Icon(
                                Icons.description,
                                size: 40,
                                color: AppTheme.primaryColor,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                selectedFileName!,
                                style: const TextStyle(fontSize: 12),
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                '${(selectedFileSize! / 1024).toStringAsFixed(2)} KB',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          )
                        else
                          Column(
                    children: [
                      const Icon(
                        Icons.cloud_upload,
                        size: 40,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(height: 8),
                              Text(
                                'Tap to select file',
                                style: TextStyle(color: Colors.grey[600]),
                        ),
                            ],
                      ),
                    ],
                  ),
                ),
              ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Document Type*',
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
                    // Auto-fill title based on document type
                    if (value != null && titleController.text.isEmpty) {
                      titleController.text = value;
                    }
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
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Title*',
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
              TextFormField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description (Optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: isUploading || selectedFileName == null ? null : () async {
                    // Validate the form
                    if (selectedDocumentType == null || titleController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please fill in all required fields'),
                          backgroundColor: Colors.red,
                        ),
                      );
                      return;
                    }
                    
                  setState(() {
                      isUploading = true;
                  });
                    
                    try {
                      // Get the file from the picker result
                      if (pickedFile == null) {
                        throw Exception('No file selected');
                      }
                      
                      // For mobile platforms, we need to get the file path
                      final path = pickedFile?.path;
                      if (path == null || path.isEmpty) {
                        throw Exception('File path is null or empty');
                      }
                      
                      final file = File(path);
                      
                      // Upload the document using our service
                      final document = await _documentService.uploadDocument(
                        title: titleController.text,
                        type: selectedDocumentType!,
                        file: file,
                        description: descriptionController.text.isNotEmpty ? descriptionController.text : null,
                      );
                      
                      print('Document uploaded successfully: ${document.title}');
                      
                      // Close the dialog first
                      Navigator.pop(context);
                      
                      // Then fetch documents again to refresh the list
                      await _fetchDocuments();
                      
                      // Show success message
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Document uploaded successfully'),
                          backgroundColor: AppTheme.successColor,
                        ),
                  );
                    } catch (e) {
                      print('Error uploading document: $e');
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Error uploading document: ${e.toString()}'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    } finally {
                    setState(() {
                        isUploading = false;
                      });
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: Colors.grey,
                  ),
                  child: isUploading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Upload Document'),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Color _getDocumentTypeColor(String type) {
    // Map internal types to display types
    String displayType = _getDisplayDocumentType(type);
    
    switch (displayType) {
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
    // Map internal types to display types
    String displayType = _getDisplayDocumentType(type);
    
    switch (displayType) {
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
  
  // Convert internal document types to display types
  String _getDisplayDocumentType(String type) {
    // Map from internal types to display types
    final Map<String, String> typeMapping = {
      'identification': 'ID Card',
      'medical_record': 'Medical Certificate',
      'training_certificate': 'Training Certificate',
      'promotion': 'Promotion Order',
      'commendation': 'Commendation',
      'other': 'Other Document'
    };
    
    // If it's already a display type, return it
    if (AppConstants.documentTypes.contains(type)) {
      return type;
    }
    
    // Return the mapped type or the original if not found
    return typeMapping[type] ?? type;
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

  // Method to show required documents info
  void _showRequiredDocumentsInfo(BuildContext context) {
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
          return Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Required Documents',
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
                Expanded(
                  child: ListView(
                    controller: scrollController,
                    children: [
                      _buildRequiredDocumentItem(
                        'Birth Certificate',
                        'Official birth certificate issued by PSA/NSO',
                        Icons.description,
                      ),
                      _buildRequiredDocumentItem(
                        'Picture 2x2',
                        'Recent 2x2 ID picture with white background',
                        Icons.photo,
                      ),
                      _buildRequiredDocumentItem(
                        '3R ROTC Certificate',
                        'Reserve Officers\' Training Corps certificate',
                        Icons.military_tech,
                      ),
                      _buildRequiredDocumentItem(
                        'Enlistment Order',
                        'Official enlistment order document',
                        Icons.assignment,
                      ),
                      _buildRequiredDocumentItem(
                        'Promotion Order',
                        'Official promotion order document',
                        Icons.trending_up,
                      ),
                      _buildRequiredDocumentItem(
                        'Order of Incorporation',
                        'Official order of incorporation document',
                        Icons.integration_instructions,
                      ),
                      _buildRequiredDocumentItem(
                        'Schooling Certificate',
                        'Certificate of schooling or training completion',
                        Icons.school,
                      ),
                      _buildRequiredDocumentItem(
                        'College Diploma',
                        'College or university diploma',
                        Icons.workspace_premium,
                      ),
                      _buildRequiredDocumentItem(
                        'RIDS',
                        'Reservist Information Data Sheet',
                        Icons.article,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _showUploadDocumentDialog();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Upload Document'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildRequiredDocumentItem(String title, String description, IconData icon) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: AppTheme.primaryColor),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(description),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          Navigator.pop(context);
          _showUploadDocumentDialog(preselectedDocType: title);
        },
      ),
    );
  }

  // Method to view a document
  Future<void> _viewDocument(Document document) async {
    try {
      // Set loading state
      setState(() {
        _isLoading = true;
      });
      
      // Use the document URL directly if it's a web URL
      if (document.fileUrl.startsWith('http')) {
        // Launch URL using url_launcher package
        // For simplicity, we'll just show a dialog with the URL
        _showDocumentViewerDialog(document);
      } else {
        // Download the file first if it's not a direct URL
        final file = await _documentService.downloadDocument(document.id, document.fileName);
        _showDocumentViewerDialog(document, localFile: file);
      }
    } catch (e) {
      print('Error viewing document: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error viewing document: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  // Method to download a document
  Future<void> _downloadDocument(Document document) async {
    try {
      // Set loading state
      setState(() {
        _isLoading = true;
      });
      
      // Show downloading indicator
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Downloading document...'),
          duration: Duration(seconds: 1),
        ),
      );
      
      // Download the document
      final file = await _documentService.downloadDocument(document.id, document.fileName);
      
      // Get a user-friendly path to display
      String displayPath = 'App Storage';
      if (file.path.contains('documents')) {
        displayPath = 'App Documents Folder';
      }
      
      // Show success message with file path
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Document downloaded successfully!', 
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text('Saved to: $displayPath'),
            ],
          ),
          backgroundColor: AppTheme.successColor,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'VIEW',
            textColor: Colors.white,
            onPressed: () async {
              // Show document viewer
              _viewDocument(document);
            },
          ),
        ),
      );
    } catch (e) {
      print('Error downloading document: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error downloading document: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  // Show document viewer dialog
  void _showDocumentViewerDialog(Document document, {File? localFile}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(document.title),
        content: SizedBox(
          width: double.maxFinite,
          height: 400,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Document info
              Text('Type: ${document.type}', style: const TextStyle(fontWeight: FontWeight.bold)),
              Text('Filename: ${document.fileName}'),
              if (document.description != null && document.description!.isNotEmpty)
                Text('Description: ${document.description}'),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 12),
              
              // Document preview
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: _buildFilePreview(localFile, document),
                  ),
                ),
              ),
              
              // File location info if available
              if (localFile != null) ...[
                const SizedBox(height: 12),
                const Text('File Location:', style: TextStyle(fontWeight: FontWeight.bold)),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Text(
                    localFile.path,
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              _downloadDocument(document);
            },
            icon: const Icon(Icons.download, size: 18),
            label: const Text('Download'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
  
  // Build file preview based on file type
  Widget _buildFilePreview(File? file, Document document) {
    if (file == null) {
      return _buildPlaceholderPreview(document);
    }
    
    final String fileName = file.path.toLowerCase();
    
    try {
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
        return Image.file(
          file,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            print('Error loading image: $error');
            return _buildPlaceholderPreview(document);
          },
        );
      } else if (fileName.endsWith('.pdf')) {
        // For PDF files, we would ideally use a PDF viewer package
        // For now, just show a placeholder
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.picture_as_pdf,
              size: 80,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 16),
            Text(
              'PDF Document: ${document.title}',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'PDF preview is not available. Please download the file to view it.',
              textAlign: TextAlign.center,
            ),
          ],
        );
      } else {
        // For other file types
        return _buildPlaceholderPreview(document);
      }
    } catch (e) {
      print('Error building file preview: $e');
      return _buildPlaceholderPreview(document);
    }
  }
  
  // Build a placeholder preview for documents
  Widget _buildPlaceholderPreview(Document document) {
    IconData iconData;
    String fileType;
    
    final String fileName = document.fileName.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      iconData = Icons.picture_as_pdf;
      fileType = 'PDF Document';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
      iconData = Icons.image;
      fileType = 'Image';
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      iconData = Icons.description;
      fileType = 'Word Document';
    } else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      iconData = Icons.table_chart;
      fileType = 'Excel Spreadsheet';
    } else {
      iconData = Icons.insert_drive_file;
      fileType = 'Document';
    }
    
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          iconData,
          size: 80,
          color: AppTheme.primaryColor,
        ),
        const SizedBox(height: 16),
        Text(
          '$fileType: ${document.title}',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Preview is not available. Please download the file to view it.',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
} 