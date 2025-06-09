import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/app_constants.dart';
import '../models/user_model.dart';

class AuthService {
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  
  // Get current user data
  Future<User?> getCurrentUser() async {
    try {
      // Try to get user data from secure storage
      final userData = await _secureStorage.read(key: AppConstants.userDataKey);
      
      if (userData != null) {
        final Map<String, dynamic> userMap = json.decode(userData);
        print('Retrieved user data from secure storage: ${userMap['firstName']} ${userMap['lastName']}');
        return User.fromJson(userMap);
      }
      
      // If secure storage doesn't have data, try SharedPreferences as fallback
      final prefs = await SharedPreferences.getInstance();
      final prefsUserData = prefs.getString(AppConstants.userDataKey);
      
      if (prefsUserData != null) {
        final Map<String, dynamic> userMap = json.decode(prefsUserData);
        print('Retrieved user data from SharedPreferences: ${userMap['firstName']} ${userMap['lastName']}');
        
        // Migrate to secure storage for future use
        await _secureStorage.write(key: AppConstants.userDataKey, value: prefsUserData);
        return User.fromJson(userMap);
      }
      
      print('No user data found in storage');
      return null;
    } catch (e) {
      print('Error getting current user data: $e');
      return null;
    }
  }
  
  // Get user ID
  Future<String?> getCurrentUserId() async {
    try {
      // Try to get user ID from secure storage
      final userId = await _secureStorage.read(key: AppConstants.userIdKey);
      if (userId != null && userId.isNotEmpty) {
        return userId;
      }
      
      // If not found, try to get from user data
      final user = await getCurrentUser();
      if (user != null && user.id != null && user.id!.isNotEmpty) {
        // Save for future use
        await _secureStorage.write(key: AppConstants.userIdKey, value: user.id!);
        return user.id;
      }
      
      // Try SharedPreferences as last resort
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(AppConstants.userIdKey);
    } catch (e) {
      print('Error getting current user ID: $e');
      return null;
    }
  }
  
  // Login user
  Future<User?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(AppConstants.loginEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
        }),
      );
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        
        if (data['success'] == true && data['data'] != null) {
          // Save token
          final token = data['data']['token'];
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(AppConstants.authTokenKey, token);
          await _secureStorage.write(key: AppConstants.authTokenKey, value: token);
          
          // Save user data
          final userData = data['data']['user'];
          final userJson = json.encode(userData);
          await prefs.setString(AppConstants.userDataKey, userJson);
          await _secureStorage.write(key: AppConstants.userDataKey, value: userJson);
          
          // Save user ID
          final userId = userData['_id'] ?? userData['id'];
          if (userId != null) {
            await prefs.setString(AppConstants.userIdKey, userId);
            await _secureStorage.write(key: AppConstants.userIdKey, value: userId);
          }
          
          return User.fromJson(userData);
        }
      }
      
      return null;
    } catch (e) {
      print('Login error: $e');
      return null;
    }
  }
  
  // Logout user
  Future<bool> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(AppConstants.authTokenKey);
      await prefs.remove(AppConstants.userDataKey);
      await prefs.remove(AppConstants.userIdKey);
      
      await _secureStorage.delete(key: AppConstants.authTokenKey);
      await _secureStorage.delete(key: AppConstants.userDataKey);
      await _secureStorage.delete(key: AppConstants.userIdKey);
      
      return true;
    } catch (e) {
      print('Logout error: $e');
      return false;
    }
  }
} 