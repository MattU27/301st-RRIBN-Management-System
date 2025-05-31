import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:io';

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
        throw Exception('Authentication token not available');
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
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        final List<dynamic> policiesJson = data['policies'] ?? [];
        
        return policiesJson.map((json) => Policy.fromJson(json)).toList();
      } else {
        // Handle error responses
        throw Exception('Failed to load policies: ${response.statusCode}');
      }
    } on SocketException catch (e) {
      throw Exception('Network error: Please check your internet connection');
    } on HandshakeException catch (e) {
      // Handle SSL/TLS handshake issues
      throw Exception('Connection security error: Unable to establish secure connection');
    } on HttpException catch (e) {
      throw Exception('HTTP error: ${e.message}');
    } on FormatException catch (e) {
      throw Exception('Invalid response format: ${e.message}');
    } catch (e) {
      // If there's a network error or the API is not available,
      // we can return some fallback data for offline support
      print('Error fetching policies: $e');
      
      // In a production app, you might want to check if this is a connectivity issue
      // and potentially return cached data from local storage
      
      // For now, just rethrow the exception
      throw Exception('Error fetching policies: $e');
    }
  }

  Future<Policy> getPolicy(String id) async {
    try {
      // Get the authentication token
      final token = await _authService.getToken();
      
      if (token == null) {
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
      } else {
        // Handle error responses
        throw Exception('Failed to load policy: ${response.statusCode}');
      }
    } on SocketException catch (e) {
      throw Exception('Network error: Please check your internet connection');
    } on HandshakeException catch (e) {
      throw Exception('Connection security error: Unable to establish secure connection');
    } on HttpException catch (e) {
      throw Exception('HTTP error: ${e.message}');
    } on FormatException catch (e) {
      throw Exception('Invalid response format: ${e.message}');
    } catch (e) {
      print('Error fetching policy: $e');
      throw Exception('Error fetching policy: $e');
    }
  }
}

class TimeoutException implements Exception {
  final String message;
  TimeoutException(this.message);
  
  @override
  String toString() => message;
} 