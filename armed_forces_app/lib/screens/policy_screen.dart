import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../core/models/policy_model.dart';
import '../core/services/policy_service.dart';
import '../widgets/custom_appbar.dart';
import '../core/widgets/loading_widget.dart';
import '../core/widgets/error_widget.dart';
import '../core/widgets/empty_widget.dart';
import '../core/constants/app_constants.dart';
import 'package:intl/intl.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

// Helper function to get minimum of two integers
int min(int a, int b) => a < b ? a : b;

class PolicyScreen extends StatefulWidget {
  const PolicyScreen({Key? key}) : super(key: key);

  @override
  State<PolicyScreen> createState() => _PolicyScreenState();
}

class _PolicyScreenState extends State<PolicyScreen> {
  late Future<List<Policy>> _policiesFuture;
  bool _isLoading = true;
  final PolicyService _policyService = PolicyService();

  @override
  void initState() {
    super.initState();
    _loadPolicies();
  }

  Future<void> _loadPolicies() async {
    setState(() {
      _isLoading = true;
    });

    try {
      _policiesFuture = _policyService.getPolicies();
    } catch (e) {
      // Error will be handled in the FutureBuilder
      print('Error loading policies: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  Future<void> _downloadPolicyDocument(Policy policy) async {
    try {
      setState(() {
        _isLoading = true;
      });
      
      // Check if policy has an associated document
      if (policy.fileId == null && (policy.documentUrl == null || policy.documentUrl!.isEmpty)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No document available to download'),
            backgroundColor: Colors.orange,
          ),
        );
        setState(() {
          _isLoading = false;
        });
        return;
      }
      
      // Show downloading indicator
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Downloading policy document...'),
          duration: Duration(seconds: 1),
        ),
      );
      
      // First try direct MongoDB download
      if (policy.fileId != null) {
        if (kDebugMode) {
          print('Attempting direct MongoDB download for policy: ${policy.title}');
        }
        
        final fileBytes = await _policyService.downloadPolicyDocument(policy);
        
        if (fileBytes != null && fileBytes.isNotEmpty) {
          // Successfully downloaded from MongoDB directly
          if (kDebugMode) {
            print('Successfully downloaded file directly from MongoDB: ${fileBytes.length} bytes');
          }
          
          // Get temporary directory to save the file
          final directory = await getApplicationDocumentsDirectory();
          final filePath = '${directory.path}/${policy.title.replaceAll(' ', '_')}_policy.pdf';
          
          // Write to file
          final file = File(filePath);
          await file.writeAsBytes(fileBytes);
          
          // Show success message
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
                  Text('Saved to: ${file.path}'),
                ],
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 5),
            ),
          );
          
          setState(() {
            _isLoading = false;
          });
          return;
        } else {
          if (kDebugMode) {
            print('Direct MongoDB download failed, falling back to API methods');
          }
        }
      }
      
      // If direct MongoDB download failed or was not available, try API methods
      final token = await _policyService.getToken();
      if (token == null) {
        throw Exception('Authentication failed');
      }
      
      // Log debug info
      if (kDebugMode) {
        print('Downloading policy: ${policy.title}');
        print('Policy ID: ${policy.id}');
        print('File ID: ${policy.fileId}');
        print('Document URL: ${policy.documentUrl}');
      }
      
      // Clean the policy ID string if it contains ObjectId wrapper
      final String cleanPolicyId = _cleanObjectId(policy.id);
      
      Uri uri;
      // First try to use documentUrl if available
      if (policy.documentUrl != null && policy.documentUrl!.isNotEmpty) {
        // If documentUrl is a relative path, append it to the base URL
        if (policy.documentUrl!.startsWith('/')) {
          uri = Uri.parse('${AppConstants.baseUrl}${policy.documentUrl}');
        } else {
          uri = Uri.parse('${AppConstants.baseUrl}/${policy.documentUrl}');
        }
      } 
      // If no documentUrl or it fails, try using the fileId with GridFS endpoint
      else if (policy.fileId != null) {
        final String cleanFileId = _cleanObjectId(policy.fileId!);
        // Try the GridFS direct access endpoint
        uri = Uri.parse('${AppConstants.baseUrl}/api/v1/gridfs/files/${cleanFileId}');
      }
      // Fallback to the policy document endpoint
      else {
        uri = Uri.parse('${AppConstants.baseUrl}/api/v1/policies/document/${cleanPolicyId}?download=true');
      }
      
      if (kDebugMode) {
        print('Download URL: $uri');
        print('Authorization header: Bearer ${token.substring(0, min(10, token.length))}...');
      }
      
      // Download the file
      final response = await http.get(
        uri,
        headers: {'Authorization': 'Bearer $token'},
      );
      
      if (kDebugMode) {
        print('Response status code: ${response.statusCode}');
        print('Response headers: ${response.headers}');
        if (response.statusCode != 200) {
          print('Response body: ${response.body}');
        }
      }
      
      if (response.statusCode != 200) {
        // Try alternative endpoint if first attempt fails
        if (policy.fileId != null) {
          final String cleanFileId = _cleanObjectId(policy.fileId!);
          // Try the policyFiles.files collection endpoint
          final fallbackUri = Uri.parse('${AppConstants.baseUrl}/api/v1/policyFiles/${cleanFileId}');
          
          if (kDebugMode) {
            print('First attempt failed. Trying fallback URL: $fallbackUri');
          }
          
          final fallbackResponse = await http.get(
            fallbackUri,
            headers: {'Authorization': 'Bearer $token'},
          );
          
          if (fallbackResponse.statusCode == 200) {
            // Success with fallback URL
            if (kDebugMode) {
              print('Fallback URL succeeded with status code: ${fallbackResponse.statusCode}');
            }
            
            // Get temporary directory to save the file
            final directory = await getApplicationDocumentsDirectory();
            final filePath = '${directory.path}/${policy.title.replaceAll(' ', '_')}_policy.pdf';
            
            // Write to file
            final file = File(filePath);
            await file.writeAsBytes(fallbackResponse.bodyBytes);
            
            // Show success message
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
                    Text('Saved to: ${file.path}'),
                  ],
                ),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 5),
              ),
            );
            
            setState(() {
              _isLoading = false;
            });
            return;
          } else if (kDebugMode) {
            print('Fallback URL also failed with status code: ${fallbackResponse.statusCode}');
            print('Fallback response body: ${fallbackResponse.body}');
            
            // Try one more fallback with documentUrl if available
            if (policy.documentUrl != null && policy.documentUrl!.isNotEmpty) {
              final String documentPath = policy.documentUrl!.startsWith('/') 
                  ? policy.documentUrl! 
                  : '/${policy.documentUrl!}';
              final lastFallbackUri = Uri.parse('${AppConstants.baseUrl}${documentPath}');
              
              print('Trying last fallback with documentUrl: $lastFallbackUri');
              
              try {
                final lastFallbackResponse = await http.get(
                  lastFallbackUri,
                  headers: {'Authorization': 'Bearer $token'},
                );
                
                if (lastFallbackResponse.statusCode == 200) {
                  // Success with last fallback URL
                  print('Last fallback URL succeeded with status code: ${lastFallbackResponse.statusCode}');
                  
                  // Get temporary directory to save the file
                  final directory = await getApplicationDocumentsDirectory();
                  final filePath = '${directory.path}/${policy.title.replaceAll(' ', '_')}_policy.pdf';
                  
                  // Write to file
                  final file = File(filePath);
                  await file.writeAsBytes(lastFallbackResponse.bodyBytes);
                  
                  // Show success message
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
                          Text('Saved to: ${file.path}'),
                        ],
                      ),
                      backgroundColor: Colors.green,
                      duration: const Duration(seconds: 5),
                    ),
                  );
                  
                  setState(() {
                    _isLoading = false;
                  });
                  return;
      } else {
                  print('Last fallback URL also failed with status code: ${lastFallbackResponse.statusCode}');
                }
              } catch (e) {
                print('Error with last fallback attempt: $e');
              }
            }
          }
        }
        
        throw Exception('Failed to download document: HTTP ${response.statusCode}');
      }
      
      // Get temporary directory to save the file
      final directory = await getApplicationDocumentsDirectory();
      final filePath = '${directory.path}/${policy.title.replaceAll(' ', '_')}_policy.pdf';
      
      // Write to file
      final file = File(filePath);
      await file.writeAsBytes(response.bodyBytes);
      
      // Show success message
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
              Text('Saved to: ${file.path}'),
            ],
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 5),
        ),
      );
      
    } catch (e) {
      print('Error downloading policy document: $e');
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
  
  // Helper method to properly clean ObjectId strings
  String _cleanObjectId(String id) {
    // If it contains ObjectId wrapper, extract just the hex string
    if (id.contains('ObjectId')) {
      // Extract the 24-character hex string from ObjectId("HEXSTRING")
      final regex = RegExp(r'ObjectId\("([0-9a-f]{24})"\)');
      final match = regex.firstMatch(id);
      if (match != null && match.groupCount >= 1) {
        return match.group(1)!;
      }
    }
    
    // Already a clean hex string
    if (id.length == 24 && RegExp(r'^[0-9a-f]{24}$').hasMatch(id)) {
      return id;
    }
    
    // Remove any non-hex characters
    final cleaned = id.replaceAll(RegExp(r'[^0-9a-f]'), '');
    
    // If we have a valid hex string after cleaning, return it
    if (cleaned.length == 24) {
      return cleaned;
    }
    
    // If all else fails, return the original
    return id;
  }
  
  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _viewPolicyDetails(Policy policy) {
    final hasDocument = policy.fileId != null || (policy.documentUrl != null && policy.documentUrl!.isNotEmpty);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(policy.title),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Category badge
                  Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                  color: AppTheme.secondaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  policy.category,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.secondaryColor,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              // PDF indicator if available
              if (hasDocument) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.picture_as_pdf,
                        size: 24,
                        color: Colors.red.shade700,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                              'PDF Document Available',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.red.shade700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Use the download button below to save the document',
                              style: TextStyle(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              
              // Description
              const Text(
                'Description',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          policy.description,
                          style: const TextStyle(fontSize: 14),
              ),
              if (policy.description.length > 150)
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    'Tap for more details...',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.primaryColor,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              
              // Content (if available)
              if (policy.content.isNotEmpty && !hasDocument) ...[
                const Text(
                  'Content',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  policy.content,
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 16),
              ] else if (hasDocument && policy.content.isEmpty) ...[
                const Text(
                  'Content',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'This policy content is available as a PDF document. Please use the download button to access the full content.',
                  style: TextStyle(fontSize: 14, fontStyle: FontStyle.italic),
                ),
                const SizedBox(height: 16),
              ],
              
              // Metadata
              const Divider(),
              const SizedBox(height: 8),
              
              // Dates and version info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Effective Date',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                      Text(
                        DateFormat('MMM d, yyyy').format(policy.effectiveDate),
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        'Version',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                      Text(
                        policy.version,
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              if (policy.expirationDate != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text(
                      'Expires: ',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                    Text(
                      DateFormat('MMM d, yyyy').format(policy.expirationDate!),
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
              
              const SizedBox(height: 8),
              Row(
                children: [
                  const Text(
                    'Status: ',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: policy.status == 'published' ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      policy.status.toUpperCase(),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: policy.status == 'published' ? Colors.green : Colors.orange,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              Text(
                'Last updated: ${DateFormat('MMM d, yyyy').format(policy.lastUpdated)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
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
          if (policy.fileId != null || (policy.documentUrl != null && policy.documentUrl!.isNotEmpty))
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                _downloadPolicyDocument(policy);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(
        title: 'Policies',
        showBackButton: false,
      ),
      body: Column(
        children: [
          // Main content
          Expanded(
            child: FutureBuilder<List<Policy>>(
              future: _policiesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting || _isLoading) {
                  return const LoadingWidget(message: 'Loading policies...');
                } else if (snapshot.hasError) {
                  // If there's an error but we still have data (fallback data or MongoDB data), 
                  // show the data with a banner notification
                  if (snapshot.hasError && (snapshot.data?.isNotEmpty ?? false)) {
                    // Show data with warning banner
                    final isUsingFallbackData = snapshot.data!.any((p) => p.id == '1' && p.title == 'Standard Operating Procedures');
                    final bannerColor = isUsingFallbackData 
                        ? Colors.amber.shade100 
                        : Colors.blue.shade50;
                    final bannerTextColor = isUsingFallbackData 
                        ? Colors.amber.shade900 
                        : Colors.blue.shade900;
                    final bannerText = isUsingFallbackData
                        ? 'Using offline data. Policy management features are limited.'
                        : 'Connected directly to database. API is under maintenance.';
                    
                    return Column(
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                          color: bannerColor,
                          child: Row(
                            children: [
                              Icon(Icons.info_outline, color: bannerTextColor, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  bannerText,
                                  style: TextStyle(color: bannerTextColor),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(child: _buildPolicyList(snapshot.data!)),
                      ],
                    );
                  }
                  
                  return CustomErrorWidget(
                    message: snapshot.error.toString(),
                    onRetry: _loadPolicies,
                  );
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const EmptyWidget(
                    message: 'No policies found',
                    icon: Icons.policy,
                  );
                } else {
                  // Sort policies by last updated date (newest first)
                  final policies = snapshot.data!..sort((a, b) => 
                      b.lastUpdated.compareTo(a.lastUpdated)
                  );
                  
                  return _buildPolicyList(policies);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyList(List<Policy> policies) {
    return RefreshIndicator(
      onRefresh: _loadPolicies,
      child: ListView.builder(
        itemCount: policies.length,
        padding: const EdgeInsets.all(16),
        itemBuilder: (context, index) {
          final policy = policies[index];
          final hasDocument = policy.fileId != null || (policy.documentUrl != null && policy.documentUrl!.isNotEmpty);
    
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: InkWell(
              onTap: () => _viewPolicyDetails(policy),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
                    // Title and category
              Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          policy.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.secondaryColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  policy.category,
                              style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.secondaryColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Download button
                        if (hasDocument)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.red.shade50,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.red.shade200),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.picture_as_pdf,
                                  size: 16,
                                  color: Colors.red.shade700,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'PDF',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.red.shade700,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
                    
                    // Description
                    Text(
                      policy.description,
                      style: const TextStyle(fontSize: 14),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (policy.description.length > 150)
                      Align(
                        alignment: Alignment.centerRight,
                    child: Text(
                          'Tap for more details...',
                          style: TextStyle(
                        fontSize: 12,
                            color: AppTheme.primaryColor,
                            fontStyle: FontStyle.italic,
                          ),
                ),
              ),
              const SizedBox(height: 16),
              
                    // Dates and details
              Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Effective date
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                            const Text(
                      'Effective Date', 
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              DateFormat('MMM d, yyyy').format(policy.effectiveDate),
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
                        
                        // Expiration date if available
                        if (policy.expirationDate != null)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                              const Text(
                                'Expires',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                              Text(
                                DateFormat('MMM d, yyyy').format(policy.expirationDate!),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
                          
                        // Version
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
              const Text(
                              'Version',
                style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                            Text(
                              policy.version,
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    
                    // View Details button
                const SizedBox(height: 16),
                    Center(
                  child: ElevatedButton.icon(
                        onPressed: () => _viewPolicyDetails(policy),
                        icon: const Icon(Icons.visibility, size: 18),
                        label: const Text('View Details'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
        },
      ),
    );
  }
} 