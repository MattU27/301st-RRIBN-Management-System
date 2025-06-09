import 'package:mongo_dart/mongo_dart.dart' as mongo;
import 'dart:async';
import 'package:flutter/foundation.dart';
import '../constants/app_constants.dart';
import '../config/mongodb_config.dart';

class DatabaseService {
  static DatabaseService? _instance;
  mongo.Db? _db;
  bool _isConnected = false;
  
  // Singleton pattern
  factory DatabaseService() {
    _instance ??= DatabaseService._internal();
    return _instance!;
  }
  
  DatabaseService._internal();
  
  Future<void> connect() async {
    if (_isConnected) return;
    
    try {
      // Determine the appropriate connection string based on environment
      String connectionString;
      
      if (kReleaseMode || kIsWeb) {
        // Use production MongoDB Atlas connection for deployed app
        connectionString = '${MongoDBConfig.productionConnectionString}/${MongoDBConfig.databaseName}?retryWrites=true&w=majority&appName=Cluster0';
      } else {
        // Use local connection for development
        connectionString = 'mongodb://10.0.2.2:27017/afp_personnel_db';
      }
      
      print('Connecting to MongoDB using: $connectionString');
      _db = await mongo.Db.create(connectionString);
      await _db!.open();
      _isConnected = true;
      print('Connected to MongoDB: afp_personnel_db');
    } catch (e) {
      print('Error connecting to MongoDB: $e');
      _isConnected = false;
      rethrow;
    }
  }
  
  Future<void> close() async {
    if (_db != null && _isConnected) {
      await _db!.close();
      _isConnected = false;
      print('Disconnected from MongoDB');
    }
  }
  
  mongo.DbCollection getCollection(String collectionName) {
    if (_db == null || !_isConnected) {
      throw Exception('Database not connected. Call connect() first.');
    }
    return _db!.collection(collectionName);
  }
  
  // Helper method to check connection
  bool get isConnected => _isConnected;
  
  // Basic CRUD operations
  
  // Create
  Future<mongo.ObjectId> insert(String collectionName, Map<String, dynamic> document) async {
    try {
      final collection = getCollection(collectionName);
      final result = await collection.insertOne(document);
      if (result.isSuccess) {
        return result.id as mongo.ObjectId;
      }
      throw Exception('Failed to insert document');
    } catch (e) {
      print('Error inserting document: $e');
      rethrow;
    }
  }
  
  // Read
  Future<List<Map<String, dynamic>>> find(
    String collectionName, {
    Map<String, dynamic>? filter,
    Map<String, dynamic>? sort,
    int? limit,
    int? skip,
  }) async {
    try {
      final collection = getCollection(collectionName);
      final selector = filter ?? {};
      
      // Create query
      var query = collection.find(selector);
      
      // Apply sorting if specified
      if (sort != null) {
        // Convert to SelectorBuilder
        final selectorBuilder = mongo.where.raw(selector);
        for (var entry in sort.entries) {
          selectorBuilder.sortBy(entry.key, descending: entry.value == -1);
        }
        query = collection.find(selectorBuilder);
      }
      
      // Apply pagination
      if (skip != null) {
        query = query.skip(skip);
      }
      
      if (limit != null) {
        query = query.take(limit);
      }
      
      final results = await query.toList();
      return results;
    } catch (e) {
      print('Error finding documents: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>?> findOne(
    String collectionName, {
    required Map<String, dynamic> filter,
  }) async {
    try {
      final collection = getCollection(collectionName);
      final result = await collection.findOne(filter);
      return result;
    } catch (e) {
      print('Error finding document: $e');
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>?> findById(
    String collectionName,
    String id,
  ) async {
    try {
      final cleanId = _cleanObjectIdString(id);
      final objectId = mongo.ObjectId.fromHexString(cleanId);
      final collection = getCollection(collectionName);
      final result = await collection.findOne(mongo.where.id(objectId));
      return result;
    } catch (e) {
      print('Error finding document by ID: $e');
      rethrow;
    }
  }
  
  // Helper to clean ObjectId strings that might include the ObjectId wrapper
  String _cleanObjectIdString(String idStr) {
    if (idStr.contains('ObjectId')) {
      // Extract the hex string from ObjectId(...) format
      final regex = RegExp(r'ObjectId\("([a-f0-9]{24})"\)');
      final match = regex.firstMatch(idStr);
      if (match != null && match.groupCount >= 1) {
        return match.group(1)!;
      }
      
      // Try alternate format
      final regex2 = RegExp(r'["\(]([a-f0-9]{24})["\)]');
      final match2 = regex2.firstMatch(idStr);
      if (match2 != null && match2.groupCount >= 1) {
        return match2.group(1)!;
      }
    }
    
    // Remove any non-hex characters if present
    final cleanedStr = idStr.replaceAll(RegExp(r'[^a-f0-9]'), '');
    if (cleanedStr.length == 24) {
      return cleanedStr;
    }
    
    // If the string already looks like a clean hex string, return it as is
    if (idStr.length == 24 && RegExp(r'^[a-f0-9]{24}$').hasMatch(idStr)) {
      return idStr;
    }
    
    // If we get here, just return the original and let Mongo handle errors
    return idStr;
  }
  
  // Update
  Future<bool> updateOne(
    String collectionName, {
    required Map<String, dynamic> filter,
    required Map<String, dynamic> update,
  }) async {
    try {
      final collection = getCollection(collectionName);
      final result = await collection.updateOne(filter, update);
      return result.isSuccess;
    } catch (e) {
      print('Error updating document: $e');
      rethrow;
    }
  }
  
  Future<bool> updateById(
    String collectionName,
    String id,
    Map<String, dynamic> update,
  ) async {
    try {
      final cleanId = _cleanObjectIdString(id);
      final objectId = mongo.ObjectId.fromHexString(cleanId);
      final collection = getCollection(collectionName);
      final result = await collection.updateOne(
        mongo.where.id(objectId),
        {'\$set': update},
      );
      return result.isSuccess;
    } catch (e) {
      print('Error updating document by ID: $e');
      rethrow;
    }
  }
  
  // Delete
  Future<bool> deleteOne(
    String collectionName, {
    required Map<String, dynamic> filter,
  }) async {
    try {
      final collection = getCollection(collectionName);
      final result = await collection.deleteOne(filter);
      return result.isSuccess;
    } catch (e) {
      print('Error deleting document: $e');
      rethrow;
    }
  }
  
  Future<bool> deleteById(
    String collectionName,
    String id,
  ) async {
    try {
      final cleanId = _cleanObjectIdString(id);
      final objectId = mongo.ObjectId.fromHexString(cleanId);
      final collection = getCollection(collectionName);
      final result = await collection.deleteOne(mongo.where.id(objectId));
      return result.isSuccess;
    } catch (e) {
      print('Error deleting document by ID: $e');
      rethrow;
    }
  }
} 