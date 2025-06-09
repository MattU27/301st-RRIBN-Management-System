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
import '../models/user_model.dart';  // Import user model
import '../screens/home_screen.dart'; // Import for NotificationState
import '../services/document_service.dart'; // Import the document service
import '../services/socket_service.dart'; // Import the socket service
import '../services/auth_service.dart';  // Import auth service

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({Key? key}) : super(key: key);

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<Document> _documents = [];
  final DocumentService _documentService = DocumentService();
  final SocketService _socketService = SocketService();
  final AuthService _authService = AuthService();  // Add auth service
  
  // User information
  String _userName = '';
  
  // Filter state
  String _selectedFilter = 'All';
  final List<String> _filterOptions = ['All', 'Missing', 'Pending', 'Verified', 'Rejected'];

  @override
  void initState() {
    super.initState();
    _initializeSocket();
    _loadUserInfo();
    _updateDocumentsWithUploaderInfo();
    _fetchDocuments();
  }

  @override
  void dispose() {
    super.dispose();
  }

  // Load current user information
  Future<void> _loadUserInfo() async {
    try {
      final userData = await _authService.getCurrentUser();
      if (userData != null) {
        setState(() {
          _userName = '${userData.firstName} ${userData.lastName}';
        });
      } else {
        // Try to get from SharedPreferences as fallback
        final prefs = await SharedPreferences.getInstance();
        final userDataStr = prefs.getString(AppConstants.userDataKey);
        if (userDataStr != null) {
          final userMap = json.decode(userDataStr);
          setState(() {
            _userName = '${userMap['firstName'] ?? ''} ${userMap['lastName'] ?? ''}';
          });
        }
      }
      
      // If still empty, use a default
      if (_userName.trim().isEmpty) {
        setState(() {
          _userName = 'My Documents';
        });
      }
    } catch (e) {
      print('Error loading user info: $e');
      setState(() {
        _userName = 'My Documents';
      });
    }
  }

  Future<void> _initializeSocket() async {
    try {
      await _socketService.initSocket();
      print('Socket initialized in DocumentsScreen: ${_socketService.isConnected ? 'connected' : 'not connected'}');
    } catch (e) {
      print('Error initializing socket: $e');
    }
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
    // Filter options
    String selectedFilter = 'All';
    List<String> filterOptions = ['All', 'Missing', 'Pending', 'Verified', 'Rejected'];
    
    // Filter documents based on selected filter
    List<String> filteredDocTypes = AppConstants.documentTypes;
    
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
          // Add test document button (only in debug mode)
          if (const bool.fromEnvironment('dart.vm.product') == false)
            IconButton(
              icon: const Icon(Icons.add_circle),
              onPressed: () async {
                _showCreateSampleDocumentDialog();
              },
              tooltip: 'Create Sample Document',
            ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              _showDocumentInfoDialog(context);
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
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _buildRequirementsView(context),
    );
  }

  // Build the requirements view
  Widget _buildRequirementsView(BuildContext context) {
    return StatefulBuilder(
      builder: (context, setStateLocal) {
        // Filter documents based on selected filter
        List<String> filteredDocTypes = AppConstants.documentTypes;
        if (_selectedFilter != 'All') {
          filteredDocTypes = AppConstants.documentTypes.where((docType) {
            final status = _getDocumentStatus(docType);
            return status.toLowerCase() == _selectedFilter.toLowerCase();
          }).toList();
        }
        
        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Check your document submission status below',
                    style: TextStyle(
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildDocumentCompletionProgress(),
                  const SizedBox(height: 16),
                  
                  // Filter chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _filterOptions.map((filter) {
                        final isSelected = filter == _selectedFilter;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: FilterChip(
                            label: Text(filter),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() {
                                  _selectedFilter = filter;
                                });
                                setStateLocal(() {});
                              }
                            },
                            backgroundColor: Colors.grey[200],
                            selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                            checkmarkColor: AppTheme.primaryColor,
                            labelStyle: TextStyle(
                              color: isSelected ? AppTheme.primaryColor : Colors.black87,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildDocumentStatusLegend(),
                ],
              ),
            ),
            
            // Document grid
            Expanded(
              child: filteredDocTypes.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No ${_selectedFilter} documents found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Try selecting a different filter',
                          style: TextStyle(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  )
                : GridView.count(
                    padding: const EdgeInsets.all(16),
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 0.8,
                    children: filteredDocTypes.map((docType) => 
                      _buildRequiredDocumentCard(docType)
                    ).toList(),
                  ),
            ),
          ],
        );
      }
    );
  }

  // Show document info dialog
  void _showDocumentInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Document Requirements'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'The following documents are required for all reservists:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _buildInfoItem('Birth Certificate', 'Official birth certificate issued by PSA/NSO'),
              _buildInfoItem('Picture 2x2', 'Recent 2x2 ID picture with white background'),
              _buildInfoItem('3R ROTC Certificate', 'Reserve Officers\' Training Corps certificate'),
              _buildInfoItem('Enlistment Order', 'Official enlistment order document'),
              _buildInfoItem('Promotion Order', 'Official promotion order document'),
              _buildInfoItem('Order of Incorporation', 'Official order of incorporation document'),
              _buildInfoItem('Schooling Certificate', 'Certificate of schooling or training completion'),
              _buildInfoItem('College Diploma', 'College or university diploma'),
              _buildInfoItem('RIDS', 'Reservist Information Data Sheet'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          Text(
            description,
            style: TextStyle(color: Colors.grey[700], fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsList(List<Document> documents) {
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
    
    // Get uploader information
    final uploaderName = document.uploaderFullName;
    final serviceId = document.uploaderServiceId;
    final company = document.uploaderCompany;
    
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
            
            // Upload date and uploader info
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
            
            // Display uploader information if available
            if (uploaderName != 'Unknown User') ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.person, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 6),
                  Text(
                    'By: $uploaderName',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  if (serviceId.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    Text(
                      '($serviceId)',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                  if (company.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    Text(
                      '| $company',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ],
              ),
            ],
            
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
                      final response = await _documentService.uploadDocument(
                        title: titleController.text,
                        type: selectedDocumentType!,
                        filePath: path,
                        description: descriptionController.text.isNotEmpty ? descriptionController.text : null,
                      );
                      
                      if (response['success'] == true) {
                        print('Document uploaded successfully: ${titleController.text}');
                        
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
                      } else {
                        throw Exception(response['error'] ?? 'Unknown error occurred');
                      }
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

  // Build document completion progress indicator
  Widget _buildDocumentCompletionProgress() {
    // Count documents by status
    int totalRequired = AppConstants.documentTypes.length;
    int verified = 0;
    int pending = 0;
    int rejected = 0;
    
    for (String docType in AppConstants.documentTypes) {
      String status = _getDocumentStatus(docType);
      if (status == 'verified') {
        verified++;
      } else if (status == 'pending') {
        pending++;
      } else if (status == 'rejected') {
        rejected++;
      }
    }
    
    int missing = totalRequired - verified - pending - rejected;
    double completionPercentage = (verified + pending) / totalRequired;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Document Completion',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                '${(completionPercentage * 100).toStringAsFixed(0)}%',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppTheme.primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: completionPercentage,
              backgroundColor: Colors.grey[300],
              color: AppTheme.primaryColor,
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem('Verified', verified, AppTheme.successColor),
              _buildStatItem('Pending', pending, AppTheme.warningColor),
              _buildStatItem('Missing', missing, Colors.grey),
              _buildStatItem('Rejected', rejected, AppTheme.errorColor),
            ],
          ),
        ],
      ),
    );
  }

  // Build a stat item for document completion
  Widget _buildStatItem(String label, int count, Color color) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              count.toString(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }

  // Build a legend for document status indicators
  Widget _buildDocumentStatusLegend() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildLegendItem('Verified', AppTheme.successColor),
          _buildLegendItem('Pending', AppTheme.warningColor),
          _buildLegendItem('Missing', Colors.grey),
          _buildLegendItem('Rejected', AppTheme.errorColor),
        ],
      ),
    );
  }

  // Build a legend item
  Widget _buildLegendItem(String label, Color color) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[800],
          ),
        ),
      ],
    );
  }

  // Build a document requirement card
  Widget _buildRequiredDocumentCard(String documentType) {
    // Check if the user has submitted this document type
    final documentStatus = _getDocumentStatus(documentType);
    
    Color statusColor;
    IconData statusIcon;
    String statusText;
    
    switch (documentStatus) {
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
        statusColor = Colors.grey;
        statusIcon = Icons.add_circle_outline;
        statusText = 'Missing';
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: statusColor.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          if (documentStatus == 'missing') {
            _showUploadDocumentDialog(preselectedDocType: documentType);
          } else {
            // Find and show the existing document
            final existingDoc = _findDocumentByType(documentType);
            if (existingDoc != null) {
              _viewDocument(existingDoc);
            } else {
              _showUploadDocumentDialog(preselectedDocType: documentType);
            }
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getDocumentTypeIcon(documentType),
                  color: statusColor,
                  size: 28,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                documentType,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      statusIcon,
                      color: statusColor,
                      size: 12,
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
              const SizedBox(height: 8),
              Text(
                documentStatus == 'missing' ? 'Tap to upload' : documentStatus == 'pending' ? 'Tap to view/delete' : 'Tap to view',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Get document status for a specific document type
  String _getDocumentStatus(String documentType) {
    // Define a mapping between display document types and internal types
    final Map<String, List<String>> documentTypeMapping = {
      'Birth Certificate': ['birth certificate'],
      'ID Card': ['id card', 'id', 'identification'],
      'Picture 2x2': ['picture 2x2', '2x2', 'picture', 'photo'],
      '3R ROTC Certificate': ['rotc', '3r rotc', 'rotc certificate', '3r rotc certificate'],
      'Enlistment Order': ['enlistment', 'enlistment order'],
      'Promotion Order': ['promotion', 'promotion order'],
      'Order of Incorporation': ['incorporation', 'order of incorporation'],
      'Schooling Certificate': ['schooling certificate'],
      'College Diploma': ['diploma', 'college diploma', 'university diploma'],
      'RIDS': ['rids', 'reservist information', 'data sheet'],
      'Medical Certificate': ['medical', 'medical certificate', 'health'],
      'Training Certificate': ['training certificate'],
      'Deployment Order': ['deployment', 'deployment order'],
      'Commendation': ['commendation', 'award', 'recognition'],
      'Other': ['other']
    };
    
    // Special case for 3R ROTC Certificate
    if (documentType == '3R ROTC Certificate') {
      final matchingDocs = _documents.where((doc) {
        final String docTitle = doc.title.toLowerCase();
        return docTitle.contains('rotc') || docTitle == '3r rotc certificate';
      }).toList();
      
      if (matchingDocs.isNotEmpty) {
        // Return the document with the best status
        if (matchingDocs.any((doc) => doc.status == 'verified')) {
          return 'verified';
        } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
          return 'pending';
        } else {
          return 'rejected';
        }
      }
    }
    
    // Special case for Birth Certificate
    if (documentType == 'Birth Certificate') {
      final matchingDocs = _documents.where((doc) {
        final String docTitle = doc.title.toLowerCase();
        return docTitle == 'birth certificate';
      }).toList();
      
      if (matchingDocs.isNotEmpty) {
        // Return the document with the best status
        if (matchingDocs.any((doc) => doc.status == 'verified')) {
          return 'verified';
        } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
          return 'pending';
        } else {
          return 'rejected';
        }
      }
    }
    
    // Special case for Schooling Certificate vs Training Certificate
    if (documentType == 'Schooling Certificate') {
      final matchingDocs = _documents.where((doc) {
        final String docTitle = doc.title.toLowerCase();
        return docTitle.contains('schooling');
      }).toList();
      
      if (matchingDocs.isNotEmpty) {
        // Print debug info
        print('Schooling Certificate - exact match found: ${matchingDocs.length}');
        for (var doc in matchingDocs) {
          print('  - ${doc.title} (${doc.type}): ${doc.status}');
        }
        
        // If there are multiple documents of this type, get the one with the best status
        if (matchingDocs.any((doc) => doc.status == 'verified')) {
          return 'verified';
        } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
          return 'pending';
        } else {
          return 'rejected';
        }
      }
    }
    
    // Special case for Other document type
    if (documentType == 'Other') {
      // Check if there are any documents that don't match any specific category
      final otherDocs = _documents.where((doc) {
        final String docTitle = doc.title.toLowerCase();
        
        // Check if this document matches any specific category
        for (var entry in documentTypeMapping.entries) {
          if (entry.key != 'Other') {
            for (String keyword in entry.value) {
              if (docTitle.contains(keyword)) {
                return false; // This document matches a specific category
              }
            }
          }
        }
        
        return true; // This document doesn't match any specific category
      }).toList();
      
      // Print debug info
      print('Other documents found: ${otherDocs.length}');
      for (var doc in otherDocs) {
        print('  - ${doc.title} (${doc.type}): ${doc.status}');
      }
      
      if (otherDocs.isEmpty) {
        return 'missing';
      }
      
      // If there are multiple documents of this type, get the one with the best status
      if (otherDocs.any((doc) => doc.status == 'verified')) {
        return 'verified';
      } else if (otherDocs.any((doc) => doc.status == 'pending')) {
        return 'pending';
      } else {
        return 'rejected';
      }
    }
    
    // Get the keywords for the requested document type
    List<String> typeKeywords = documentTypeMapping[documentType] ?? [documentType.toLowerCase()];
    
    // Find documents that match this specific document type
    final matchingDocs = _documents.where((doc) {
      final String docTitle = doc.title.toLowerCase();
      final String docType = doc.type.toLowerCase();
      
      // Special case for "Schooling Certificate" vs "Training Certificate"
      if (documentType == 'Schooling Certificate') {
        return docTitle == 'schooling certificate';
      }
      
      if (documentType == 'Training Certificate') {
        // For Training Certificate, make sure it's not a Schooling Certificate
        if (docTitle.contains('schooling')) {
          return false;
        }
      }
      
      // Check if document matches any of the keywords for this document type
      bool isMatch = false;
      for (String keyword in typeKeywords) {
        if (docTitle == keyword || docType == keyword) {
          isMatch = true;
          break;
        }
      }
      
      return isMatch;
    }).toList();
    
    // Print debug info
    print('Document type: $documentType');
    print('Matching documents: ${matchingDocs.length}');
    for (var doc in matchingDocs) {
      print('  - ${doc.title} (${doc.type}): ${doc.status}');
    }
    
    if (matchingDocs.isEmpty) {
      return 'missing';
    }
    
    // If there are multiple documents of this type, get the one with the best status
    // Priority: verified > pending > rejected
    if (matchingDocs.any((doc) => doc.status == 'verified')) {
      return 'verified';
    } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
      return 'pending';
    } else {
      return 'rejected';
    }
  }

  // Find a document by type with strict matching
  Document? _findDocumentByType(String documentType) {
    // Define a mapping between display document types and internal types
    final Map<String, List<String>> documentTypeMapping = {
      'Birth Certificate': ['birth certificate'],
      'ID Card': ['id card', 'id', 'identification'],
      'Picture 2x2': ['picture 2x2', '2x2', 'picture', 'photo'],
      '3R ROTC Certificate': ['rotc', '3r rotc', 'rotc certificate', '3r rotc certificate'],
      'Enlistment Order': ['enlistment', 'enlistment order'],
      'Promotion Order': ['promotion', 'promotion order'],
      'Order of Incorporation': ['incorporation', 'order of incorporation'],
      'Schooling Certificate': ['schooling certificate'],
      'College Diploma': ['diploma', 'college diploma', 'university diploma'],
      'RIDS': ['rids', 'reservist information', 'data sheet'],
      'Medical Certificate': ['medical', 'medical certificate', 'health'],
      'Training Certificate': ['training certificate'],
      'Deployment Order': ['deployment', 'deployment order'],
      'Commendation': ['commendation', 'award', 'recognition'],
      'Other': ['other']
    };
    
    // Special case for 3R ROTC Certificate
    if (documentType == '3R ROTC Certificate') {
      final matchingDocs = _documents.where((doc) {
        final String docTitle = doc.title.toLowerCase();
        return docTitle.contains('rotc') || docTitle == '3r rotc certificate';
      }).toList();
      
      if (matchingDocs.isNotEmpty) {
        // Return the document with the best status
        if (matchingDocs.any((doc) => doc.status == 'verified')) {
          return matchingDocs.firstWhere((doc) => doc.status == 'verified');
        } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
          return matchingDocs.firstWhere((doc) => doc.status == 'pending');
        } else {
          return matchingDocs.first;
        }
      }
    }
    
    // Special case for Birth Certificate
    if (documentType == 'Birth Certificate') {
      final matchingDocs = _documents.where((doc) {
        final String docTitle = doc.title.toLowerCase();
        return docTitle == 'birth certificate';
      }).toList();
      
      if (matchingDocs.isNotEmpty) {
        // Return the document with the best status
        if (matchingDocs.any((doc) => doc.status == 'verified')) {
          return matchingDocs.firstWhere((doc) => doc.status == 'verified');
        } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
          return matchingDocs.firstWhere((doc) => doc.status == 'pending');
        } else {
          return matchingDocs.first;
        }
      }
    }
    
    // Special case for Schooling Certificate
    if (documentType == 'Schooling Certificate') {
      final matchingDocs = _documents.where((doc) {
        final String docTitle = doc.title.toLowerCase();
        return docTitle.contains('schooling');
      }).toList();
      
      if (matchingDocs.isNotEmpty) {
        // Return the document with the best status
        if (matchingDocs.any((doc) => doc.status == 'verified')) {
          return matchingDocs.firstWhere((doc) => doc.status == 'verified');
        } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
          return matchingDocs.firstWhere((doc) => doc.status == 'pending');
        } else {
          return matchingDocs.first;
        }
      }
    }
    
    // Get the keywords for the requested document type
    List<String> typeKeywords = documentTypeMapping[documentType] ?? [documentType.toLowerCase()];
    
    // Find documents that match this specific document type
    final matchingDocs = _documents.where((doc) {
      final String docTitle = doc.title.toLowerCase();
      final String docType = doc.type.toLowerCase();
      
      // Special case for "Schooling Certificate" vs "Training Certificate"
      if (documentType == 'Schooling Certificate') {
        return docTitle == 'schooling certificate';
      }
      
      if (documentType == 'Training Certificate') {
        // For Training Certificate, make sure it's not a Schooling Certificate
        if (docTitle.contains('schooling')) {
          return false;
        }
      }
      
      // Check if document matches any of the keywords for this document type
      bool isMatch = false;
      for (String keyword in typeKeywords) {
        if (docTitle == keyword || docType == keyword) {
          isMatch = true;
          break;
        }
      }
      
      return isMatch;
    }).toList();
    
    if (matchingDocs.isEmpty) {
      return null;
    }
    
    // Return the document with the best status
    if (matchingDocs.any((doc) => doc.status == 'verified')) {
      return matchingDocs.firstWhere((doc) => doc.status == 'verified');
    } else if (matchingDocs.any((doc) => doc.status == 'pending')) {
      return matchingDocs.firstWhere((doc) => doc.status == 'pending');
    } else {
      return matchingDocs.first;
    }
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
              
              // Show status with color
              Row(
                children: [
                  Text('Status: ', style: const TextStyle(fontWeight: FontWeight.bold)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _getStatusColor(document.status).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _getStatusColor(document.status)),
                    ),
                    child: Text(
                      _capitalizeFirst(document.status),
                      style: TextStyle(
                        color: _getStatusColor(document.status),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              
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
          // Show delete button only for pending documents
          if (document.status == 'pending')
            TextButton.icon(
              onPressed: () {
                // Close the viewer dialog
                Navigator.pop(context);
                // Show delete confirmation
                _showDeleteDocumentConfirmation(document);
              },
              icon: const Icon(Icons.delete, color: AppTheme.errorColor),
              label: const Text('Delete', style: TextStyle(color: AppTheme.errorColor)),
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
  
  // Show delete confirmation dialog
  void _showDeleteDocumentConfirmation(Document document) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Document'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Are you sure you want to delete this document?',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'This action cannot be undone. The document will be permanently removed from the system.',
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: Row(
                children: [
                  Icon(
                    _getDocumentTypeIcon(document.type),
                    color: _getDocumentTypeColor(document.type),
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          document.title,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          document.fileName,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.pop(context);
              
              // Show loading indicator
              setState(() {
                _isLoading = true;
              });
              
              try {
                final result = await _documentService.deleteDocument(document.id);
                
                if (result) {
                  // Show success message
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Document deleted successfully'),
                      backgroundColor: AppTheme.successColor,
                    ),
                  );
                  
                  // Refresh documents list
                  await _fetchDocuments();
                } else {
                  throw Exception('Failed to delete document');
                }
              } catch (e) {
                print('Error deleting document: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error deleting document: ${e.toString()}'),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              } finally {
                setState(() {
                  _isLoading = false;
                });
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.errorColor,
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.delete),
            label: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  // Helper method to get status color
  Color _getStatusColor(String status) {
    switch (status) {
      case 'verified':
        return AppTheme.successColor;
      case 'pending':
        return AppTheme.warningColor;
      case 'rejected':
        return AppTheme.errorColor;
      default:
        return Colors.grey;
    }
  }

  // Helper method to capitalize first letter
  String _capitalizeFirst(String text) {
    if (text.isEmpty) return '';
    return text[0].toUpperCase() + text.substring(1);
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

  // Update all documents with proper uploader information
  Future<void> _updateDocumentsWithUploaderInfo() async {
    try {
      print('Updating documents with proper uploader information...');
      final updatedCount = await _documentService.updateAllDocumentsWithUploaderInfo();
      print('Updated $updatedCount documents with proper uploader information');
      
      if (updatedCount > 0) {
        // Show a success message if documents were updated
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Updated $updatedCount documents with correct uploader information'),
            backgroundColor: AppTheme.successColor,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      print('Error updating documents with uploader info: $e');
    }
  }

  // Show dialog to create a sample document
  void _showCreateSampleDocumentDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Sample Document'),
        content: const Text(
          'This will create a sample document in the database for testing purposes. '
          'It will be visible in your documents list and can be used to test the download functionality.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              
              // Show loading indicator
              setState(() {
                _isLoading = true;
              });
              
              try {
                final result = await _documentService.createSampleDocument();
                
                if (result['success'] == true) {
                  // Show success message
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Sample document created successfully. Document ID: ${result['data']['documentId']}'),
                      backgroundColor: AppTheme.successColor,
                    ),
                  );
                  
                  // Refresh documents list
                  await _fetchDocuments();
                } else {
                  throw Exception(result['error'] ?? 'Failed to create sample document');
                }
              } catch (e) {
                print('Error creating sample document: $e');
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error creating sample document: ${e.toString()}'),
                    backgroundColor: AppTheme.errorColor,
                  ),
                );
              } finally {
                setState(() {
                  _isLoading = false;
                });
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
} 