import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:flutter/foundation.dart';

import '../constants/app_constants.dart';
import '../models/policy_model.dart';
import '../services/auth_service.dart';
import '../services/mongodb_service.dart';

class PolicyService {
  final String baseUrl = AppConstants.baseUrl;
  final AuthService _authService = AuthService();
  final MongoDBService _mongoDBService = MongoDBService();
  
  // Maximum number of retries for API calls
  final int _maxRetries = 3;

  // Get authentication token
  Future<String?> getToken() async {
    final token = await _authService.getToken();
    if (kDebugMode) {
      if (token != null) {
        print('Retrieved token: ${token.substring(0, min(10, token.length))}...');
      } else {
        print('No token retrieved from auth service');
      }
    }
    return token;
  }

  // Helper to get minimum of two integers
  int min(int a, int b) {
    return a < b ? a : b;
  }

  // Fetch policies from the API
  Future<List<Policy>> getPolicies() async {
    // Since we have policies in MongoDB, try direct connection first
    try {
      if (kDebugMode) {
        print('Attempting direct MongoDB connection to fetch policies');
      }
      final policies = await _mongoDBService.getPolicies();
      
      if (policies.isNotEmpty) {
        if (kDebugMode) {
          print('Successfully fetched ${policies.length} policies directly from MongoDB');
        }
        return policies;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error with direct MongoDB connection: $e');
      }
      // Continue to API fallback if MongoDB connection fails
    }
    
    // If MongoDB connection failed or returned empty, try API
    int retryCount = 0;
    
    while (retryCount < _maxRetries) {
    try {
      // Get the authentication token
      final token = await _authService.getToken();
      
      if (token == null) {
          if (kDebugMode) {
            print('Authentication token not available - using fallback data');
          }
          return _getFallbackPolicies();
        }
        
        if (kDebugMode) {
          print('Fetching policies from: $baseUrl/api/v1/policies');
          print('Using token: ${token.substring(0, min(10, token.length))}...');
      }
      
      // Make API request - trying the v1 API path
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/policies'),
        headers: {
            'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
          },
        ).timeout(
          const Duration(seconds: 15),
          onTimeout: () => throw TimeoutException('Connection timed out'),
        );
        
        if (kDebugMode) {
          print('Response status code: ${response.statusCode}');
        }
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
          if (kDebugMode) {
            print('Received data: ${data.keys}');
          }
          
          final List<dynamic> policiesJson = data['policies'] ?? [];
          if (kDebugMode) {
            print('Found ${policiesJson.length} policies');
            
            // Debug log the date fields from the first policy
            if (policiesJson.isNotEmpty) {
              final firstPolicy = policiesJson[0];
              print('Sample policy date fields:');
              print('  effectiveDate: ${firstPolicy['effectiveDate']}');
              print('  expirationDate: ${firstPolicy['expirationDate']}');
              print('  createdAt: ${firstPolicy['createdAt']}');
              print('  updatedAt: ${firstPolicy['updatedAt']}');
            }
          }
          
          // Process each policy to ensure dates are correctly formatted
          final policies = policiesJson.map((json) {
            // Process date fields to ensure they're in the correct format
            final processedJson = _processDateFields(json);
            return Policy.fromJson(processedJson);
          }).toList();
          
          // Sort policies by date (newest first)
          policies.sort((a, b) => b.lastUpdated.compareTo(a.lastUpdated));
          
          return policies;
        } else if (response.statusCode == 404) {
          // API endpoint not found - use fallback data
          if (kDebugMode) {
            print('Policy API endpoint not found (404). Using fallback policies.');
          }
          return _getFallbackPolicies();
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          // Authentication issue - token may be invalid
          if (kDebugMode) {
            print('Authentication error (${response.statusCode}): ${response.body}');
            print('Retrying with new token (attempt ${retryCount + 1})');
          }
          
          // Clear the invalid token and retry
          await _authService.clearToken();
          retryCount++;
          
          if (retryCount >= _maxRetries) {
            // If we've exhausted retries, use fallback data
            return _getFallbackPolicies();
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
        } else {
          // Handle other error responses
          if (kDebugMode) {
            print('Error response: ${response.body}');
          }
          
          // Return fallback data for this demo version
          return _getFallbackPolicies();
        }
      } on SocketException catch (e) {
        if (kDebugMode) {
          print('SocketException: $e');
        }
        return _getFallbackPolicies();
      } on HandshakeException catch (e) {
        if (kDebugMode) {
          print('HandshakeException: $e');
        }
        return _getFallbackPolicies();
      } on HttpException catch (e) {
        if (kDebugMode) {
          print('HttpException: $e');
        }
        return _getFallbackPolicies();
      } on FormatException catch (e) {
        if (kDebugMode) {
          print('FormatException: $e');
        }
        return _getFallbackPolicies();
      } catch (e) {
        if (kDebugMode) {
          print('Unexpected error (attempt ${retryCount + 1}): $e');
        }
        
        // If this is an authentication error, retry
        if (e.toString().contains('Invalid authentication token')) {
          retryCount++;
          
          if (retryCount >= _maxRetries) {
            return _getFallbackPolicies();
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
        }
        
        // Default to fallback data for any other error
        return _getFallbackPolicies();
      }
    }
    
    // If we've exhausted retries, use fallback data
    if (kDebugMode) {
      print('Exhausted retries, using fallback policies');
    }
    return _getFallbackPolicies();
  }

  // Fallback policies for offline testing
  List<Policy> _getFallbackPolicies() {
    // Create some sample policies for testing when offline
    return [
      Policy(
        id: '1',
        title: 'Standard Operating Procedures',
        description: 'This document outlines the standard operating procedures for all personnel.',
        content: 'All personnel must follow these standard operating procedures at all times...',
        category: 'Operations',
        version: '1.0',
        status: 'published',
        effectiveDate: DateTime.now().subtract(const Duration(days: 30)),
        createdAt: DateTime.now().subtract(const Duration(days: 60)),
        lastUpdated: DateTime.now().subtract(const Duration(days: 15)),
      ),
      Policy(
        id: '2',
        title: 'Code of Conduct',
        description: 'Guidelines for professional behavior and ethical standards for all military personnel.',
        content: 'All personnel must adhere to the following code of conduct...',
        category: 'Conduct',
        version: '2.1',
        status: 'published',
        effectiveDate: DateTime.now().subtract(const Duration(days: 45)),
        createdAt: DateTime.now().subtract(const Duration(days: 90)),
        lastUpdated: DateTime.now().subtract(const Duration(days: 10)),
      ),
      Policy(
        id: '3',
        title: 'Uniform Standards',
        description: 'Standards for proper uniform wear and maintenance',
        content: 'The following standards apply to all uniform items...',
        category: 'Uniform',
        version: '1.2',
        status: 'published',
        effectiveDate: DateTime.now().subtract(const Duration(days: 60)),
        createdAt: DateTime.now().subtract(const Duration(days: 120)),
        lastUpdated: DateTime.now().subtract(const Duration(days: 5)),
      ),
    ];
  }

  Future<Policy> getPolicy(String id) async {
    // Since we have policies in MongoDB, try direct connection first
    try {
      if (kDebugMode) {
        print('Attempting direct MongoDB connection to fetch policy: $id');
      }
      
      final policy = await _mongoDBService.getPolicyById(id);
      if (policy != null) {
        if (kDebugMode) {
          print('Successfully fetched policy from MongoDB: ${policy.title}');
        }
        return policy;
      } else {
        if (kDebugMode) {
          print('Policy not found in MongoDB, trying API...');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error with direct MongoDB connection: $e');
      }
      // Continue to API fallback if MongoDB connection fails
    }
    
    // If MongoDB connection failed or policy not found, try API
    int retryCount = 0;
    
    while (retryCount < _maxRetries) {
    try {
      // Get the authentication token
      final token = await _authService.getToken();
      
      if (token == null) {
          if (kDebugMode) {
            print('Authentication token not available - using fallback policy');
          }
          return _getFallbackPolicyById(id);
      }
      
      if (kDebugMode) {
        print('Fetching policy from: $baseUrl/api/v1/policies/$id');
      }
      
      // Make API request
      final response = await http.get(
        Uri.parse('$baseUrl/api/v1/policies/$id'),
        headers: {
            'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        ).timeout(
          const Duration(seconds: 15),
          onTimeout: () => throw TimeoutException('Connection timed out'),
        );
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return Policy.fromJson(data['policy']);
        } else if (response.statusCode == 404) {
          // API endpoint or policy not found
          if (kDebugMode) {
            print('Policy API endpoint or policy not found (404). Using fallback policy.');
          }
          return _getFallbackPolicyById(id);
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          // Authentication issue - token may be invalid
          if (kDebugMode) {
            print('Authentication error (${response.statusCode}): ${response.body}');
            print('Retrying with new token (attempt ${retryCount + 1})');
          }
          
          // Clear the invalid token and retry
          await _authService.clearToken();
          retryCount++;
          
          if (retryCount >= _maxRetries) {
            return _getFallbackPolicyById(id);
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
      } else {
        // Handle error responses
          if (kDebugMode) {
            print('Error response (${response.statusCode}): ${response.body}');
          }
          return _getFallbackPolicyById(id);
        }
      } on SocketException catch (e) {
        if (kDebugMode) {
          print('SocketException: $e');
        }
        return _getFallbackPolicyById(id);
      } on HandshakeException catch (e) {
        if (kDebugMode) {
          print('HandshakeException: $e');
        }
        return _getFallbackPolicyById(id);
      } on HttpException catch (e) {
        if (kDebugMode) {
          print('HttpException: $e');
        }
        return _getFallbackPolicyById(id);
      } on FormatException catch (e) {
        if (kDebugMode) {
          print('FormatException: $e');
        }
        return _getFallbackPolicyById(id);
      } catch (e) {
        if (kDebugMode) {
          print('Error fetching policy: $e');
        }
        
        // If this is an authentication error, retry
        if (e.toString().contains('Invalid authentication token')) {
          retryCount++;
          
          if (retryCount >= _maxRetries) {
            return _getFallbackPolicyById(id);
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
        }
        
        return _getFallbackPolicyById(id);
      }
    }
    
    // If we've exhausted retries, use fallback
    return _getFallbackPolicyById(id);
  }
  
  // Helper method to get a fallback policy by ID
  Policy _getFallbackPolicyById(String id) {
    // Find in the fallback policies list or create a generic one
    final fallbackPolicies = _getFallbackPolicies();
    return fallbackPolicies.firstWhere(
      (p) => p.id == id,
      orElse: () => Policy(
        id: id,
        title: 'Policy Details',
        description: 'This is a placeholder for policy details that could not be retrieved.',
        content: 'The requested policy details are not available at this time. Please try again later.',
        category: 'General',
        version: '1.0',
        status: 'published',
        effectiveDate: DateTime.now().subtract(const Duration(days: 30)),
        createdAt: DateTime.now().subtract(const Duration(days: 60)),
        lastUpdated: DateTime.now().subtract(const Duration(days: 15)),
      ),
    );
  }

  // Helper method to process date fields in API responses
  Map<String, dynamic> _processDateFields(Map<String, dynamic> json) {
    final result = Map<String, dynamic>.from(json);
    
    // List of fields that should be processed as dates
    final dateFields = [
      'effectiveDate', 
      'expirationDate', 
      'createdAt', 
      'updatedAt',
      'lastUpdated'
    ];
    
    for (final field in dateFields) {
      if (result.containsKey(field)) {
        final value = result[field];
        
        // Skip if already processed or null
        if (value == null) continue;
        
        if (kDebugMode) {
          print('Processing field $field in policy service: $value (${value.runtimeType})');
        }
        
        // If it's already a DateTime, keep it as is
        if (value is DateTime) {
          if (kDebugMode) {
            print('  Field is already DateTime, keeping as is: $value');
          }
          continue;
        }
        
        // Handle MongoDB date format
        if (value is Map && value.containsKey('\$date')) {
          if (kDebugMode) {
            print('Processing MongoDB date format for $field: $value');
          }
          
          // Extract the date value
          if (value['\$date'] is String) {
            // Convert to DateTime object
            try {
              result[field] = DateTime.parse(value['\$date']);
              if (kDebugMode) {
                print('  Converted to DateTime: ${result[field]}');
              }
            } catch (e) {
              if (kDebugMode) {
                print('  Error parsing date: $e');
              }
              // Keep as string if parsing fails
              result[field] = value['\$date'];
            }
          } else if (value['\$date'] is int) {
            // Convert timestamp to DateTime
            final date = DateTime.fromMillisecondsSinceEpoch(value['\$date']);
            result[field] = date;
            if (kDebugMode) {
              print('  Converted timestamp to DateTime: ${result[field]}');
            }
          }
        } 
        // Handle string dates that aren't in ISO format
        else if (value is String) {
          // If it's a date without time (e.g. "2025-05-31")
          try {
            DateTime parsedDate;
            if (!value.contains('T') && value.contains('-')) {
              // Add time component to make it a valid ISO date
              parsedDate = DateTime.parse('${value}T00:00:00.000Z');
            } else {
              // Try to parse as regular ISO date
              parsedDate = DateTime.parse(value);
            }
            
            result[field] = parsedDate;
            
            if (kDebugMode) {
              print('  Parsed string to DateTime: ${result[field]}');
            }
          } catch (e) {
            if (kDebugMode) {
              print('Error processing date string: $e for value: $value');
            }
            // Keep original value if parsing fails
          }
        }
      }
      
      // Also check for dot notation field format (field.$date)
      final dotField = '$field.\$date';
      if (result.containsKey(dotField)) {
        if (kDebugMode) {
          print('Found MongoDB dot notation date field: $dotField = ${result[dotField]}');
        }
        
        final value = result[dotField];
        if (value != null) {
          try {
            // Parse the value to DateTime
            if (value is String) {
              result[field] = DateTime.parse(value);
            } else if (value is int) {
              result[field] = DateTime.fromMillisecondsSinceEpoch(value);
            } else {
              // Keep as is for other types
              result[field] = value;
            }
            
            // Remove the dot notation field to avoid confusion
            result.remove(dotField);
            
            if (kDebugMode) {
              print('  Set $field to: ${result[field]}');
      }
    } catch (e) {
            if (kDebugMode) {
              print('  Error parsing dot notation date: $e');
              // Use the value directly as fallback
              result[field] = value;
              result.remove(dotField);
            }
          }
        }
      }
    }
    
    return result;
  }

  // Download policy document directly from MongoDB
  Future<List<int>?> downloadPolicyDocument(Policy policy) async {
    try {
      if (kDebugMode) {
        print('Attempting to download policy document directly from MongoDB');
        print('Policy ID: ${policy.id}');
        print('File ID: ${policy.fileId}');
      }
      
      // Check if policy has an associated document
      if (policy.fileId == null) {
        if (kDebugMode) {
          print('No fileId available for policy');
        }
        return null;
      }
      
      // Clean IDs for MongoDB
      final String cleanPolicyId = _cleanObjectId(policy.id);
      final String cleanFileId = _cleanObjectId(policy.fileId!);
      
      if (kDebugMode) {
        print('Cleaned Policy ID: $cleanPolicyId');
        print('Cleaned File ID: $cleanFileId');
      }
      
      // Try to download the file directly using MongoDB service
      final fileBytes = await _mongoDBService.getPolicyFile(cleanPolicyId, cleanFileId);
      
      if (fileBytes != null && fileBytes.isNotEmpty) {
        if (kDebugMode) {
          print('Successfully downloaded file from MongoDB: ${fileBytes.length} bytes');
        }
        return fileBytes;
      } else {
        if (kDebugMode) {
          print('Failed to download file from MongoDB');
        }
        return null;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error downloading policy document from MongoDB: $e');
      }
      return null;
    }
  }
  
  // Helper method to clean ObjectId strings
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
}

class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);
  
  @override
  String toString() => message;
} 