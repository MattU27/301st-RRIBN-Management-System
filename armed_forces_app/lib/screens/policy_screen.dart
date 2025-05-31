import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../core/models/policy_model.dart';
import '../core/services/policy_service.dart';
import '../widgets/custom_appbar.dart';
import '../core/widgets/loading_widget.dart';
import '../core/widgets/error_widget.dart';
import '../core/widgets/empty_widget.dart';
import '../core/constants/app_constants.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'package:flutter/foundation.dart';

class PolicyScreen extends StatefulWidget {
  const PolicyScreen({Key? key}) : super(key: key);

  @override
  State<PolicyScreen> createState() => _PolicyScreenState();
}

class _PolicyScreenState extends State<PolicyScreen> with SingleTickerProviderStateMixin {
  late Future<List<Policy>> _policiesFuture;
  bool _isLoading = true;
  String _currentFilter = 'all'; // 'all', 'published', 'draft', 'archived'
  late TabController _tabController;
  final PolicyService _policyService = PolicyService();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(_handleTabChange);
    _loadPolicies();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  void _handleTabChange() {
    if (!_tabController.indexIsChanging) {
      setState(() {
        switch (_tabController.index) {
          case 0:
            _currentFilter = 'all';
            break;
          case 1:
            _currentFilter = 'published';
            break;
          case 2:
            _currentFilter = 'draft';
            break;
          case 3:
            _currentFilter = 'archived';
            break;
        }
      });
    }
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
  
  Future<void> _viewPolicyDocument(Policy policy) async {
    try {
      if (policy.documentUrl != null && policy.documentUrl!.isNotEmpty) {
        final url = '${AppConstants.baseUrl}${policy.documentUrl}';
        final Uri uri = Uri.parse(url);
        
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          throw 'Could not launch $url';
        }
      } else {
        _showErrorDialog('No document available for this policy');
      }
    } catch (e) {
      _showErrorDialog('Error opening document: $e');
    }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(
        title: 'Policies & Guidelines',
        showBackButton: true,
        onBackPressed: () => Navigator.pop(context),
      ),
      body: Column(
        children: [
          // Tab bar for filtering policies
          TabBar(
            controller: _tabController,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppTheme.primaryColor,
            tabs: const [
              Tab(text: 'All'),
              Tab(text: 'Published'),
              Tab(text: 'Drafts'),
              Tab(text: 'Archived'),
            ],
          ),
          
          // Main content
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadPolicies,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : FutureBuilder<List<Policy>>(
                      future: _policiesFuture,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const LoadingWidget(message: 'Loading policies...');
                        }

                        if (snapshot.hasError) {
                          String errorMessage = 'Failed to load policies';
                          
                          // Provide more user-friendly error messages
                          if (snapshot.error.toString().contains('HandshakeException')) {
                            errorMessage = 'Unable to connect securely to the server. Please check your connection and try again.';
                          } else if (snapshot.error.toString().contains('SocketException') || 
                                     snapshot.error.toString().contains('Network error')) {
                            errorMessage = 'Network connection issue. Please check your internet connection and try again.';
                          } else if (snapshot.error.toString().contains('timeout')) {
                            errorMessage = 'Connection timed out. The server is taking too long to respond.';
                          }
                          
                          return CustomErrorWidget(
                            message: errorMessage,
                            onRetry: _loadPolicies,
                          );
                        }

                        final allPolicies = snapshot.data ?? [];
                        
                        // Filter policies based on selected tab
                        final List<Policy> filteredPolicies;
                        if (_currentFilter == 'all') {
                          filteredPolicies = allPolicies;
                        } else {
                          filteredPolicies = allPolicies.where((p) => p.status == _currentFilter).toList();
                        }

                        if (filteredPolicies.isEmpty) {
                          return EmptyWidget(
                            message: 'No ${_currentFilter == 'all' ? '' : _currentFilter} policies available',
                            icon: Icons.policy,
                          );
                        }

                        return ListView.builder(
                          itemCount: filteredPolicies.length,
                          padding: const EdgeInsets.all(16),
                          itemBuilder: (context, index) {
                            final policy = filteredPolicies[index];
                            return _buildPolicyCard(policy);
                          },
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyCard(Policy policy) {
    // Debug print to see the actual date values
    if (kDebugMode) {
      print('Policy: ${policy.title}');
      print('  Effective Date: ${policy.effectiveDate}');
      print('  Expiration Date: ${policy.expirationDate}');
      print('  Created At: ${policy.createdAt}');
      print('  Last Updated: ${policy.lastUpdated}');
    }
    
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          _showPolicyDetails(policy);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getPolicyIcon(policy.category),
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          policy.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              'v${policy.version}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey[700],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Updated: ${_formatDateExact(policy.lastUpdated)}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          policy.description,
                          style: const TextStyle(fontSize: 14),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          policy.category,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.blue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _getStatusBadge(policy.status),
                    ],
                  ),
                  TextButton.icon(
                    onPressed: () {
                      _showPolicyDetails(policy);
                    },
                    icon: const Icon(
                      Icons.arrow_forward,
                      size: 16,
                    ),
                    label: const Text('View Details'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppTheme.primaryColor,
                      minimumSize: Size.zero,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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

  void _showPolicyDetails(Policy policy) {
    // Debug log to verify dates
    if (kDebugMode) {
      print('Showing policy details:');
      print('  Title: ${policy.title}');
      print('  Effective Date: ${policy.effectiveDate}');
      print('  Expiration Date: ${policy.expirationDate}');
      print('  Created At: ${policy.createdAt}');
      print('  Last Updated: ${policy.lastUpdated}');
    }
    
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: Container(
          padding: const EdgeInsets.all(20),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.8,
            maxWidth: MediaQuery.of(context).size.width * 0.9,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getPolicyIcon(policy.category),
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(width: 12),
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
                        Row(
                          children: [
                            Text(
                              'Version ${policy.version}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[700],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(width: 12),
                            _getStatusBadge(policy.status),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      policy.category,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.blue,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                policy.description,
                style: const TextStyle(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                ),
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              
              // Policy metadata with accurate dates
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'Effective Date', 
                      _formatDateExact(policy.effectiveDate)
                    ),
                  ),
                  if (policy.expirationDate != null)
                    Expanded(
                      child: _buildInfoItem(
                        'Expiration Date', 
                        _formatDateExact(policy.expirationDate!)
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'Created', 
                      _formatDateExact(policy.createdAt)
                    ),
                  ),
                  Expanded(
                    child: _buildInfoItem(
                      'Last Updated', 
                      _formatDateExact(policy.lastUpdated)
                    ),
                  ),
                ],
              ),
              if (policy.createdBy != null) ...[
                const SizedBox(height: 8),
                _buildInfoItem(
                  'Created By', 
                  '${policy.createdBy!['firstName'] ?? ''} ${policy.createdBy!['lastName'] ?? ''}'
                ),
              ],
              
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              
              const Text(
                'Content',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: SingleChildScrollView(
                  child: Text(
                    policy.content,
                    style: const TextStyle(fontSize: 14),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              // Document view button if available
              if (policy.documentUrl != null && policy.documentUrl!.isNotEmpty) ...[
                const Divider(),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _viewPolicyDocument(policy),
                    icon: const Icon(Icons.visibility),
                    label: const Text('View Document'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
              
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Close'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Helper method to build an info item
  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  IconData _getPolicyIcon(String category) {
    switch (category.toLowerCase()) {
      case 'training':
        return Icons.school;
      case 'conduct':
        return Icons.gavel;
      case 'uniform':
        return Icons.military_tech;
      case 'operations':
        return Icons.public;
      case 'health':
        return Icons.health_and_safety;
      case 'promotions':
        return Icons.trending_up;
      case 'security':
        return Icons.security;
      case 'hr':
        return Icons.people;
      case 'finance':
        return Icons.attach_money;
      case 'compliance':
        return Icons.verified;
      case 'general':
        return Icons.article;
      default:
        return Icons.policy;
    }
  }

  String _formatDate(DateTime date) {
    return DateFormat('MMM d, yyyy').format(date);
  }

  // Format date in the exact format from MongoDB (yyyy-MM-dd)
  String _formatDateExact(DateTime date) {
    try {
      // Check if the date is valid
      if (date.year < 1900 || date.year > 2100) {
        if (kDebugMode) {
          print('Invalid date detected: $date');
        }
        // Return a placeholder for invalid dates
        return 'Date not available';
      }
      
      // Log the date being formatted
      if (kDebugMode) {
        print('Formatting date: $date');
        // Check if this is the expiration date and log the month and day
        print('  Year: ${date.year}, Month: ${date.month}, Day: ${date.day}');
      }
      
      // Format as May 31, 2025
      return DateFormat('MMM d, yyyy').format(date);
    } catch (e) {
      if (kDebugMode) {
        print('Error formatting date: $e for date: $date');
      }
      return 'Date not available';
    }
  }

  // Helper method to get status badge
  Widget _getStatusBadge(String status) {
    switch (status.toLowerCase()) {
      case 'published':
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Text(
            'Published',
            style: TextStyle(
              fontSize: 12,
              color: Colors.green,
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      case 'draft':
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: Colors.amber.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Text(
            'Draft',
            style: TextStyle(
              fontSize: 12,
              color: Colors.amber,
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      case 'archived':
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: Colors.grey.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Text(
            'Archived',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
} 