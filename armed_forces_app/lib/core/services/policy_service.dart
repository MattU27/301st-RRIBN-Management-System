import 'dart:convert';
import 'package:http/http.dart' as http;

import '../constants/app_constants.dart';
import '../models/policy_model.dart';
import '../services/auth_service.dart';

class PolicyService {
  final String baseUrl = AppConstants.baseUrl;
  final AuthService _authService = AuthService();

  // Fetch policies from the API
  Future<List<Policy>> getPolicies() async {
    try {
      // Get the authentication token
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Authentication token is required');
      }
      
      // Make API request
      final response = await http.get(
        Uri.parse('$baseUrl/api/policies'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        final List<dynamic> policiesData = data['policies'] ?? [];
        
        return policiesData.map((policyData) => Policy.fromJson(policyData)).toList();
      } else {
        // Handle error responses
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to load policies');
      }
    } catch (e) {
      // If there's a network error or the API is not available,
      // we can return some fallback data for offline support
      print('Error fetching policies: $e');
      
      // In a production app, you might want to check if this is a connectivity issue
      // and potentially return cached data from local storage
      
      // For now, just rethrow the exception
      throw Exception('Failed to load policies: $e');
    }
  }

  Future<Policy> getPolicy(String id) async {
    try {
      // Get the authentication token
      final token = await _authService.getToken();
      
      if (token == null) {
        throw Exception('Authentication token is required');
      }
      
      // Make API request
      final response = await http.get(
        Uri.parse('$baseUrl/api/policies/$id'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return Policy.fromJson(data['policy']);
      } else {
        // Handle error responses
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Failed to load policy');
      }
    } catch (e) {
      print('Error fetching policy: $e');
      throw Exception('Failed to load policy: $e');
    }
  }
} 