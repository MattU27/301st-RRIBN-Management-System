import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/foundation.dart' show kReleaseMode;

class MongoDBConfig {
  // Connection string options for different environments
  static const String androidEmulatorConnectionString = 'mongodb://10.0.2.2:27017';
  static const String iosSimulatorConnectionString = 'mongodb://localhost:27017';
  static const String localConnectionString = 'mongodb://localhost:27017';
  static const String productionConnectionString = 'mongodb+srv://MattU:Jm22152927-%40@cluster0.wt06z4x.mongodb.net';
  
  // API base URL for HTTP requests
  static String get apiBaseUrl {
    if (kIsWeb) {
      // Update with your Render web service URL when deployed
      const String renderDeployedUrl = String.fromEnvironment('API_URL', 
          defaultValue: 'https://your-render-service-url.onrender.com');
      return kReleaseMode ? renderDeployedUrl : 'http://localhost:3000';
    } else if (!kIsWeb && Platform.isAndroid) {
      return kReleaseMode ? 'https://your-render-service-url.onrender.com' : 'http://10.0.2.2:3000';
    } else {
      return kReleaseMode ? 'https://your-render-service-url.onrender.com' : 'http://localhost:3000';
    }
  }
  
  // Database name and collection names
  static const String databaseName = 'afp_personnel_db';
  static const String trainingCollection = 'trainings';
  static const String announcementCollection = 'announcements';
  static const String userCollection = 'personnels'; // Updated to match existing collection
  static const String policyCollection = 'policies'; // Collection for policy documents
  static const String documentCollection = 'documents'; // Collection for uploaded documents
  
  // Connection timeouts
  static const int connectionTimeoutMs = 10000;
  static const int socketTimeoutMs = 30000;
  
  // MongoDB connection options
  static Map<String, dynamic> getConnectionOptions() {
    return {
      'connectTimeoutMS': connectionTimeoutMs,
      'socketTimeoutMS': socketTimeoutMs,
      'serverSelectionTimeoutMS': connectionTimeoutMs,
      'retryWrites': true,
      'retryReads': true,
    };
  }
} 