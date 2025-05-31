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

  // Fetch policies from the API
  Future<List<Policy>> getPolicies() async {
    int retryCount = 0;
    
    while (retryCount < _maxRetries) {
      try {
        // Get the authentication token
        final token = await _authService.getToken();
        
        if (token == null) {
          if (kDebugMode) {
            print('Authentication token not available - trying direct MongoDB connection');
          }
          return _tryDirectMongoDBConnection();
        }
        
        if (kDebugMode) {
          print('Fetching policies from: $baseUrl/api/policies');
          print('Using token: ${token.substring(0, min(10, token.length))}...');
        }
        
        // Make API request
        final response = await http.get(
          Uri.parse('$baseUrl/api/policies'),
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
            // If we've exhausted retries, try direct MongoDB connection
            return _tryDirectMongoDBConnection();
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
        } else {
          // Handle other error responses
          if (kDebugMode) {
            print('Error response: ${response.body}');
          }
          throw Exception('Failed to load policies: ${response.statusCode}');
        }
      } on SocketException catch (e) {
        if (kDebugMode) {
          print('SocketException: $e');
          print('Network error - trying direct MongoDB connection as fallback');
        }
        
        // Try direct MongoDB connection as fallback
        return _tryDirectMongoDBConnection();
      } on HandshakeException catch (e) {
        if (kDebugMode) {
          print('HandshakeException: $e');
          print('SSL/TLS error - trying direct MongoDB connection as fallback');
        }
        
        // Try direct MongoDB connection as fallback
        return _tryDirectMongoDBConnection();
      } on HttpException catch (e) {
        if (kDebugMode) {
          print('HttpException: $e');
        }
        throw Exception('HTTP error: ${e.message}');
      } on FormatException catch (e) {
        if (kDebugMode) {
          print('FormatException: $e');
        }
        throw Exception('Invalid response format: ${e.message}');
      } catch (e) {
        if (kDebugMode) {
          print('Unexpected error (attempt ${retryCount + 1}): $e');
        }
        
        // If this is an authentication error, retry
        if (e.toString().contains('Invalid authentication token')) {
          retryCount++;
          
          if (retryCount >= _maxRetries) {
            // If we've exhausted retries, try direct MongoDB connection
            return _tryDirectMongoDBConnection();
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
        }
        
        // If we can't connect to the real API, use local fallback data for testing
        if (e.toString().contains('Connection refused') || 
            e.toString().contains('Failed host lookup') ||
            e.toString().contains('HandshakeException')) {
          if (kDebugMode) {
            print('Using fallback data due to connection issue');
          }
          return _getFallbackPolicies();
        }
        
        throw Exception('Error fetching policies: $e');
      }
    }
    
    // If we've exhausted retries, use fallback data
    if (kDebugMode) {
      print('Exhausted retries, using fallback policies');
    }
    return _getFallbackPolicies();
  }

  // Try to connect directly to MongoDB as a fallback
  Future<List<Policy>> _tryDirectMongoDBConnection() async {
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
      } else {
        if (kDebugMode) {
          print('No policies found in MongoDB, using fallback data');
        }
        return _getFallbackPolicies();
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error with direct MongoDB connection: $e');
      }
      return _getFallbackPolicies();
    }
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
    int retryCount = 0;
    
    while (retryCount < _maxRetries) {
      try {
        // Get the authentication token
        final token = await _authService.getToken();
        
        if (token == null) {
          if (kDebugMode) {
            print('Authentication token not available - trying direct MongoDB connection');
          }
          
          // Try to get policy directly from MongoDB
          final policy = await _mongoDBService.getPolicyById(id);
          if (policy != null) {
            return policy;
          }
          
          throw Exception('Authentication token not available');
        }
        
        // Make API request
        final response = await http.get(
          Uri.parse('$baseUrl/api/policies/$id'),
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
            // If we've exhausted retries, try direct MongoDB connection
            final policy = await _mongoDBService.getPolicyById(id);
            if (policy != null) {
              return policy;
            }
            throw Exception('Failed to authenticate after multiple attempts');
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
        } else {
          // Handle error responses
          throw Exception('Failed to load policy: ${response.statusCode}');
        }
      } on SocketException catch (e) {
        if (kDebugMode) {
          print('SocketException: $e - trying direct MongoDB connection');
        }
        
        // Try to get policy directly from MongoDB
        final policy = await _mongoDBService.getPolicyById(id);
        if (policy != null) {
          return policy;
        }
        
        throw Exception('Network error: Please check your internet connection');
      } on HandshakeException catch (e) {
        if (kDebugMode) {
          print('HandshakeException: $e - trying direct MongoDB connection');
        }
        
        // Try to get policy directly from MongoDB
        final policy = await _mongoDBService.getPolicyById(id);
        if (policy != null) {
          return policy;
        }
        
        throw Exception('Connection security error: Unable to establish secure connection');
      } on HttpException catch (e) {
        throw Exception('HTTP error: ${e.message}');
      } on FormatException catch (e) {
        throw Exception('Invalid response format: ${e.message}');
      } catch (e) {
        if (kDebugMode) {
          print('Error fetching policy: $e');
        }
        
        // If this is an authentication error, retry
        if (e.toString().contains('Invalid authentication token')) {
          retryCount++;
          
          if (retryCount >= _maxRetries) {
            // If we've exhausted retries, try direct MongoDB connection
            final policy = await _mongoDBService.getPolicyById(id);
            if (policy != null) {
              return policy;
            }
            throw Exception('Failed to authenticate after multiple attempts');
          }
          
          // Wait briefly before retrying
          await Future.delayed(const Duration(milliseconds: 500));
          continue;
        }
        
        throw Exception('Error fetching policy: $e');
      }
    }
    
    // If we've exhausted retries, try MongoDB one last time
    final policy = await _mongoDBService.getPolicyById(id);
    if (policy != null) {
      return policy;
    }
    
    throw Exception('Failed to load policy after multiple attempts');
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
}

// Helper to get minimum of two integers
int min(int a, int b) {
  return a < b ? a : b;
}

class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);
  
  @override
  String toString() => message;
} 