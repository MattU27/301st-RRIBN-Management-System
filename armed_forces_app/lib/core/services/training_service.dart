import 'dart:async';
import 'package:mongo_dart/mongo_dart.dart' as mongo;
import 'package:flutter/foundation.dart';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'dart:convert';

import './database_service.dart';
import '../models/training_model.dart';
import '../models/training_registration_model.dart';
import '../models/user_model.dart';
import '../models/registered_personnel_model.dart';
import '../config/mongodb_config.dart';
import '../services/auth_service.dart';

class TrainingService extends ChangeNotifier {
  static const String TRAININGS_COLLECTION = 'trainings';
  static const String REGISTRATIONS_COLLECTION = 'training_registrations';
  
  // Singleton implementation
  static final TrainingService _instance = TrainingService._internal();
  
  factory TrainingService() {
    return _instance;
  }
  
  TrainingService._internal();
  
  // Base URL for API calls
  final String baseUrl = MongoDBConfig.apiBaseUrl;
  
  final DatabaseService _databaseService = DatabaseService();
  final AuthService _authService = AuthService();
  
  // Cache for trainings
  List<Training> _upcomingTrainings = [];
  List<Training> _ongoingTrainings = [];
  List<Training> _pastTrainings = [];
  Map<String, List<Training>> _userTrainings = {};
  
  // Cache for registration status - Map<userId_trainingId, isRegistered>
  final Map<String, bool> _registrationStatusCache = {};
  
  // Cache timeout duration
  final Duration _cacheTimeout = const Duration(minutes: 5);
  final Map<String, DateTime> _registrationCacheTimestamps = {};
  
  // Getters for cached data
  List<Training> get upcomingTrainings => _upcomingTrainings;
  List<Training> get ongoingTrainings => _ongoingTrainings;
  List<Training> get pastTrainings => _pastTrainings;
  
  // Get cached user trainings without making a new database request
  List<Training>? getUserTrainingsCached(String userId) {
    final cleanUserId = _cleanObjectIdString(userId);
    
    if (!_userTrainings.containsKey(cleanUserId)) {
      return null;
    }
    
    // Filter out past trainings - only return current and upcoming
    final now = DateTime.now();
    final allUserTrainings = _userTrainings[cleanUserId];
    
    if (allUserTrainings == null) {
      return null;
    }
    
    // Filter to only include trainings that are:
    // 1. Not past their end date
    // 2. Not marked as completed
    final filtered = allUserTrainings.where((training) => 
      training.endDate.isAfter(now) && 
      training.status.toLowerCase() != 'completed'
    ).toList();
    
    print('DEBUG: Returning ${filtered.length} cached trainings for user $cleanUserId');
    
    return filtered;
  }
  
  // Ensure database connection
  Future<void> _ensureDbConnected() async {
    if (!_databaseService.isConnected) {
      await _databaseService.connect();
    }
  }
  
  // Get all trainings
  Future<List<Training>> getAllTrainings() async {
    try {
      await _ensureDbConnected();
      
      final results = await _databaseService.find(
        TRAININGS_COLLECTION,
        filter: {'isActive': true},
        sort: {'startDate': 1}, // Sort by startDate ascending
      );
      
      return results.map((doc) => Training.fromMap(doc)).toList();
    } catch (e) {
      print('Error fetching trainings: $e');
      rethrow;
    }
  }
  
  // Get upcoming trainings
  Future<List<Training>> getUpcomingTrainings() async {
    try {
      await _ensureDbConnected();
      
      final now = DateTime.now();
      
      final results = await _databaseService.find(
        TRAININGS_COLLECTION,
        filter: {
          'startDate': {'\$gt': now},
          'status': {'\$ne': 'completed'}, // Exclude completed trainings
          // Use current date to determine if a training is actually upcoming
          'endDate': {'\$gt': DateTime(now.year, now.month, now.day)}, // Only include future end dates
        },
        sort: {'startDate': 1}, // Sort by startDate ascending
        limit: 10, // Limit to 10 upcoming trainings
      );
      
      // Debug: Print the actual documents we're getting
      print('DEBUG: Retrieved ${results.length} upcoming trainings');
      for (var doc in results) {
        print('DEBUG: Training document: $doc');
      }
      
      // Ensure all trainings are actually future trainings regardless of their stored data
      _upcomingTrainings = results
          .map((doc) => Training.fromMap(doc))
          .where((training) => !training.isCompleted) // Filter out completed trainings
          .toList();
      
      notifyListeners();
      return _upcomingTrainings;
    } catch (e) {
      print('Error fetching upcoming trainings: $e');
      rethrow;
    }
  }
  
  // Get ongoing trainings
  Future<List<Training>> getOngoingTrainings() async {
    try {
      await _ensureDbConnected();
      
      final now = DateTime.now();
      
      final results = await _databaseService.find(
        TRAININGS_COLLECTION,
        filter: {
          'startDate': {'\$lte': now},
          'endDate': {'\$gte': now},
        },
        sort: {'startDate': 1},
      );
      
      _ongoingTrainings = results.map((doc) => Training.fromMap(doc)).toList();
      notifyListeners();
      return _ongoingTrainings;
    } catch (e) {
      print('Error fetching ongoing trainings: $e');
      rethrow;
    }
  }
  
  // Get past trainings
  Future<List<Training>> getPastTrainings() async {
    try {
      await _ensureDbConnected();
      
      final now = DateTime.now();
      
      final results = await _databaseService.find(
        TRAININGS_COLLECTION,
        filter: {
          '\$or': [
            {'endDate': {'\$lt': now}},
            {'status': 'completed'}
          ],
        },
        sort: {'endDate': -1}, // Sort by endDate descending (most recent first)
        limit: 20, // Limit to 20 past trainings
      );
      
      _pastTrainings = results.map((doc) => Training.fromMap(doc)).toList();
      notifyListeners();
      return _pastTrainings;
    } catch (e) {
      print('Error fetching past trainings: $e');
      rethrow;
    }
  }
  
  // Get training by ID
  Future<Training?> getTrainingById(String id) async {
    try {
      await _ensureDbConnected();
      
      final result = await _databaseService.findById(
        TRAININGS_COLLECTION,
        id,
      );
      
      if (result == null) {
        return null;
      }
      
      return Training.fromMap(result);
    } catch (e) {
      print('Error fetching training by ID: $e');
      rethrow;
    }
  }
  
  // Get trainings by category
  Future<List<Training>> getTrainingsByCategory(String category) async {
    try {
      await _ensureDbConnected();
      
      final results = await _databaseService.find(
        TRAININGS_COLLECTION,
        filter: {
          'category': category,
          'isActive': true,
        },
        sort: {'startDate': 1},
      );
      
      return results.map((doc) => Training.fromMap(doc)).toList();
    } catch (e) {
      print('Error fetching trainings by category: $e');
      rethrow;
    }
  }
  
  // Get user's registered trainings
  Future<List<Training>> getUserTrainings(String userId, {bool forceRefresh = false}) async {
    try {
      await _ensureDbConnected();
      
      final cleanUserId = _cleanObjectIdString(userId);
      
      // Check cache first - if we already have trainings for this user, return them
      if (!forceRefresh && _userTrainings.containsKey(cleanUserId) && _userTrainings[cleanUserId] != null) {
        print('DEBUG: Using cached user trainings for userId: $cleanUserId');
        
        // Filter out past trainings - only return current and upcoming
        final now = DateTime.now();
        final filtered = _userTrainings[cleanUserId]!.where((training) => 
          training.endDate.isAfter(now) && 
          training.status.toLowerCase() != 'completed'
        ).toList();
        
        return filtered;
      }
      
      print('DEBUG: Fetching user trainings for userId: $cleanUserId');
      final objectId = mongo.ObjectId.fromHexString(cleanUserId);
      
      // Get user's registrations
      final registrations = await _databaseService.find(
        REGISTRATIONS_COLLECTION,
        filter: {'userId': objectId},
      );
      
      if (registrations.isEmpty) {
        _userTrainings[cleanUserId] = [];
        notifyListeners();
        return [];
      }
      
      // Extract training IDs
      final trainingIds = registrations
          .map((reg) => reg['trainingId'] as mongo.ObjectId)
          .toList();
      
      print('DEBUG: User is registered for ${trainingIds.length} trainings');
      
      // Get training details
      final results = await _databaseService.find(
        TRAININGS_COLLECTION,
        filter: {
          '_id': {'\$in': trainingIds},
          'isActive': true,
        },
        sort: {'startDate': 1},
      );
      
      // Convert to Training objects and verify user is in attendees list
      final trainings = <Training>[];
      for (final doc in results) {
        final training = Training.fromMap(doc);
        
        // Double-check that the user is actually in the attendees list
        bool isUserRegistered = false;
        
        if (doc.containsKey('attendees') && doc['attendees'] is List) {
          final attendees = doc['attendees'] as List;
          for (final attendee in attendees) {
            if (attendee is Map && 
                attendee.containsKey('userId') && 
                attendee['status'] == 'registered') {
              
              final attendeeUserId = attendee['userId'];
              if (attendeeUserId is mongo.ObjectId && 
                  attendeeUserId.toHexString() == cleanUserId) {
                isUserRegistered = true;
                break;
              }
            }
          }
        }
        
        if (isUserRegistered) {
          trainings.add(training);
        } else {
          print('DEBUG: User not found in attendees list for training: ${training.title}');
        }
      }
      
      // Filter out past trainings
      final now = DateTime.now();
      final filteredTrainings = trainings.where((training) => 
        training.endDate.isAfter(now) && 
        training.status.toLowerCase() != 'completed'
      ).toList();
      
      // Sort trainings: upcoming first, then ongoing
      filteredTrainings.sort((a, b) {
        if (a.isUpcoming && !b.isUpcoming) return -1;
        if (!a.isUpcoming && b.isUpcoming) return 1;
        if (a.isOngoing && !b.isOngoing) return -1;
        if (!a.isOngoing && b.isOngoing) return 1;
        return a.startDate.compareTo(b.startDate);
      });
      
      // Store all trainings in cache (both current and past)
      _userTrainings[cleanUserId] = trainings;
      notifyListeners();
      print('DEBUG: Fetched ${trainings.length} trainings that user is registered for: $cleanUserId');
      print('DEBUG: ${filteredTrainings.length} are current or upcoming');
      
      return filteredTrainings;
    } catch (e) {
      print('Error fetching user trainings: $e');
      rethrow;
    }
  }
  
  // Register user for a training
  Future<bool> registerForTraining(String userId, String trainingId) async {
    try {
      await _ensureDbConnected();
      
      // Clean the IDs to ensure they don't contain ObjectId wrapper text
      final cleanUserId = _cleanObjectIdString(userId);
      final cleanTrainingId = _cleanObjectIdString(trainingId);
      
      final userObjectId = mongo.ObjectId.fromHexString(cleanUserId);
      final trainingObjectId = mongo.ObjectId.fromHexString(cleanTrainingId);
      
      // Clear any existing registrations first (including canceled ones)
      await _databaseService.deleteOne(
        REGISTRATIONS_COLLECTION,
        filter: {
          'userId': userObjectId,
          'trainingId': trainingObjectId,
        },
      );
      
      // Get training to check capacity
      final trainingDoc = await _databaseService.findById(
        TRAININGS_COLLECTION,
        cleanTrainingId,
      );
      
      if (trainingDoc == null) {
        throw Exception('Training not found');
      }
      
      final training = Training.fromMap(trainingDoc);
      
      if (training.isFull) {
        throw Exception('Training is at full capacity');
      }
      
      // Remove user from attendees list if already there
      Map<String, dynamic> updates = {};
      if (trainingDoc.containsKey('attendees') && trainingDoc['attendees'] is List) {
        final attendees = List<Map<String, dynamic>>.from(trainingDoc['attendees']);
        final updatedAttendees = attendees.where((attendee) {
          final attendeeUserId = attendee['userId'];
          // Remove this user from attendees list (will add fresh entry below)
          return !(attendeeUserId is mongo.ObjectId && 
                  attendeeUserId.toHexString() == userObjectId.toHexString());
        }).toList();
        
        updates['attendees'] = updatedAttendees;
        await _databaseService.updateById(
          TRAININGS_COLLECTION,
          cleanTrainingId,
          updates,
        );
      }
      
      // Create registration
      final now = DateTime.now();
      final registration = TrainingRegistration(
        trainingId: trainingObjectId,
        userId: userObjectId,
        status: 'registered',
        registrationDate: now,
        createdAt: now,
        updatedAt: now,
      );
      
      // Insert registration
      await _databaseService.insert(
        REGISTRATIONS_COLLECTION,
        registration.toMap(),
      );
      
      // New registration entry for attendees array
      final attendeeEntry = {
        'userId': userObjectId,
        'status': 'registered',
        'registrationDate': now,
      };
      
      // Get fresh training doc after our earlier updates
      final freshTrainingDoc = await _databaseService.findById(
        TRAININGS_COLLECTION,
        cleanTrainingId,
      );
      
      if (freshTrainingDoc == null) {
        throw Exception('Training not found after updates');
      }
      
      int currentRegisteredCount = freshTrainingDoc['registered'] as int? ?? 0;
      List attendees = freshTrainingDoc['attendees'] as List? ?? [];
      
      // Update training document with registration count and add to attendees array
      await _databaseService.updateById(
        TRAININGS_COLLECTION,
        cleanTrainingId,
        {
          'registered': currentRegisteredCount + 1,
          'updatedAt': now,
          'attendees': [...attendees, attendeeEntry],
        },
      );
      
      // Update registration cache immediately to show as registered
      final cacheKey = '${cleanUserId}_${cleanTrainingId}';
      _registrationStatusCache[cacheKey] = true;
      _registrationCacheTimestamps[cacheKey] = now;
      
      // If this training is in user's cache, make sure it's in their trainings
      if (_userTrainings.containsKey(cleanUserId)) {
        final userTrainingList = _userTrainings[cleanUserId] ?? [];
        
        // Find the training in upcoming list
        final trainingToAdd = _upcomingTrainings.firstWhere(
          (t) => t.id?.toHexString() == cleanTrainingId,
          orElse: () => training,
        );
        
        // Check if it's already in user's list
        final alreadyInList = userTrainingList.any((t) => 
          t.id?.toHexString() == cleanTrainingId
        );
        
        // Add to user's trainings if not already there
        if (!alreadyInList) {
          _userTrainings[cleanUserId] = [
            ...userTrainingList,
            trainingToAdd,
          ];
        }
      }
      
      // Update cache and notify listeners
      await _refreshCaches(cleanUserId);
      
      // Explicitly refresh upcoming trainings to get the latest count
      await getUpcomingTrainings();
      
      return true;
    } catch (e) {
      print('Error registering for training: $e');
      rethrow;
    }
  }
  
  // Cancel training registration
  Future<bool> cancelRegistration(String userId, String trainingId) async {
    try {
      await _ensureDbConnected();
      
      // Clean the IDs to ensure they don't contain ObjectId wrapper text
      final cleanUserId = _cleanObjectIdString(userId);
      final cleanTrainingId = _cleanObjectIdString(trainingId);
      
      final userObjectId = mongo.ObjectId.fromHexString(cleanUserId);
      final trainingObjectId = mongo.ObjectId.fromHexString(cleanTrainingId);
      
      // Check if registered
      final existingRegistration = await _databaseService.findOne(
        REGISTRATIONS_COLLECTION,
        filter: {
          'userId': userObjectId,
          'trainingId': trainingObjectId,
          'status': 'registered', // Only active registrations
        },
      );
      
      if (existingRegistration == null) {
        // Not actively registered - check if in attendees list
        final trainingDoc = await _databaseService.findById(
          TRAININGS_COLLECTION,
          cleanTrainingId,
        );
        
        if (trainingDoc == null) {
          return false; // Training not found
        }
        
        bool foundInAttendees = false;
        if (trainingDoc.containsKey('attendees') && trainingDoc['attendees'] is List) {
          final attendees = trainingDoc['attendees'] as List;
          for (final attendee in attendees) {
            if (attendee is Map && 
                attendee.containsKey('userId') && 
                attendee['status'] == 'registered') {
              
              final attendeeUserId = attendee['userId'];
              if (attendeeUserId is mongo.ObjectId && 
                  attendeeUserId.toHexString() == userObjectId.toHexString()) {
                foundInAttendees = true;
                break;
              }
            }
          }
        }
        
        if (!foundInAttendees) {
          return false; // Not registered in either place
        }
      }
      
      // Get the training document
      final trainingDoc = await _databaseService.findById(
        TRAININGS_COLLECTION,
        cleanTrainingId,
      );
      
      if (trainingDoc == null) {
        throw Exception('Training not found');
      }
      
      // Delete the registration (rather than just updating the status)
      await _databaseService.deleteOne(
        REGISTRATIONS_COLLECTION,
        filter: {
          'userId': userObjectId,
          'trainingId': trainingObjectId,
        },
      );
      
      // Update training doc - remove from attendees and decrement count
      final now = DateTime.now();
      
      // Prepare update for training document
      int currentRegisteredCount = trainingDoc['registered'] as int? ?? 0;
      int newRegisteredCount = math.max(0, currentRegisteredCount - 1);
      
      // Remove user from attendees array if it exists
      List updatedAttendees = [];
      if (trainingDoc.containsKey('attendees') && trainingDoc['attendees'] is List) {
        final attendees = trainingDoc['attendees'] as List;
        updatedAttendees = attendees.where((attendee) {
          if (attendee is! Map || !attendee.containsKey('userId')) return true;
          
          final attendeeUserId = attendee['userId'];
          return !(attendeeUserId is mongo.ObjectId && 
                 attendeeUserId.toHexString() == userObjectId.toHexString());
        }).toList();
      }
      
      // Update training registered count and attendees
      await _databaseService.updateById(
        TRAININGS_COLLECTION,
        cleanTrainingId,
        {
          'registered': newRegisteredCount,
          'attendees': updatedAttendees,
          'updatedAt': now,
        },
      );
      
      // Clear registration status cache immediately
      final cacheKey = '${cleanUserId}_${cleanTrainingId}';
      _registrationStatusCache.remove(cacheKey);
      _registrationCacheTimestamps.remove(cacheKey);
      
      // Clear user trainings cache for this user
      if (_userTrainings.containsKey(cleanUserId)) {
        print('DEBUG: Removing training $cleanTrainingId from user trainings cache for $cleanUserId');
        final trainings = _userTrainings[cleanUserId];
        if (trainings != null) {
          // Filter out the cancelled training
          _userTrainings[cleanUserId] = trainings.where((t) => 
            t.id?.toHexString() != cleanTrainingId
          ).toList();
        }
      }
      
      // Update cache and notify listeners
      await _refreshCaches(cleanUserId);
      
      // Explicitly refresh upcoming trainings to get the latest count
      await getUpcomingTrainings();
      
      return true;
    } catch (e) {
      print('Error canceling registration: $e');
      rethrow;
    }
  }
  
  // Check if user is registered for a training
  Future<bool> isUserRegistered(String userId, String trainingId) async {
    try {
      await _ensureDbConnected();
      
      // Clean the IDs to ensure they don't contain ObjectId wrapper text
      final cleanUserId = _cleanObjectIdString(userId);
      final cleanTrainingId = _cleanObjectIdString(trainingId);
      
      final cacheKey = '${cleanUserId}_${cleanTrainingId}';
      
      // Check if we have this in cache and if the cache is still valid
      final hasValidCache = _registrationStatusCache.containsKey(cacheKey) && 
                            _registrationCacheTimestamps.containsKey(cacheKey) &&
                            DateTime.now().difference(_registrationCacheTimestamps[cacheKey]!) < _cacheTimeout;
                            
      if (hasValidCache) {
        print('DEBUG: Using cached registration status for $cacheKey');
        return _registrationStatusCache[cacheKey]!;
      }
      
      print('DEBUG: isUserRegistered - Checking for userId: $cleanUserId, trainingId: $cleanTrainingId');
      
      final userObjectId = mongo.ObjectId.fromHexString(cleanUserId);
      final trainingObjectId = mongo.ObjectId.fromHexString(cleanTrainingId);
      
      // First check the training's attendees list (most reliable source)
      final trainingDoc = await _databaseService.findById(
        TRAININGS_COLLECTION,
        cleanTrainingId,
      );
      
      if (trainingDoc == null) {
        print('DEBUG: Training document not found');
        _registrationStatusCache[cacheKey] = false;
        _registrationCacheTimestamps[cacheKey] = DateTime.now();
        return false;
      }
      
      print('DEBUG: Checking training: ${trainingDoc['title']}');
      
      // Check if user is in attendees list
      if (trainingDoc.containsKey('attendees') && trainingDoc['attendees'] is List) {
        final attendees = trainingDoc['attendees'] as List;
        print('DEBUG: Number of attendees: ${attendees.length}');
        
        // Look for the user in attendees array
        for (final attendee in attendees) {
          if (attendee is Map && 
              attendee.containsKey('userId') && 
              attendee['status'] == 'registered') {
            
            final attendeeUserId = attendee['userId'];
            
            if (attendeeUserId is mongo.ObjectId) {
              final attendeeIdStr = attendeeUserId.toHexString();
              
              if (attendeeIdStr == userObjectId.toHexString()) {
                print('DEBUG: User found in attendees list with status: ${attendee['status']}');
                _registrationStatusCache[cacheKey] = true;
                _registrationCacheTimestamps[cacheKey] = DateTime.now();
                return true;
              }
            }
          }
        }
      }
      
      // If not found in attendees, check registrations collection as backup
      final registration = await _databaseService.findOne(
        REGISTRATIONS_COLLECTION,
        filter: {
          'userId': userObjectId,
          'trainingId': trainingObjectId,
          'status': 'registered', // Only active registrations
        },
      );
      
      if (registration != null) {
        print('DEBUG: User found in registrations collection with status: ${registration['status']}');
        // Cache this result
        _registrationStatusCache[cacheKey] = true;
        _registrationCacheTimestamps[cacheKey] = DateTime.now();
        return true;
      }
      
      print('DEBUG: User not registered for this training');
      _registrationStatusCache[cacheKey] = false;
      _registrationCacheTimestamps[cacheKey] = DateTime.now();
      return false;
    } catch (e) {
      print('Error checking user registration: $e');
      rethrow;
    }
  }
  
  // Helper method to clean ObjectId strings
  String _cleanObjectIdString(String objectIdStr) {
    if (objectIdStr.contains('ObjectId')) {
      // Extract the hex string from ObjectId("hexstring")
      final hexRegex = RegExp(r'ObjectId\("([a-f0-9]{24})"\)');
      final match = hexRegex.firstMatch(objectIdStr);
      if (match != null && match.groupCount >= 1) {
        return match.group(1)!;
      }
    }
    
    // If string contains only hex characters and has the right length, use it as is
    if (RegExp(r'^[a-f0-9]{24}$').hasMatch(objectIdStr)) {
      return objectIdStr;
    }
    
    // If string contains non-hex characters, remove them and check if result is valid
    final cleanedStr = objectIdStr.replaceAll(RegExp(r'[^a-f0-9]'), '');
    if (cleanedStr.length == 24) {
      return cleanedStr;
    }
    
    throw Exception('Invalid ObjectId format: $objectIdStr');
  }
  
  // Add training (admin only)
  Future<String> addTraining(Training training) async {
    try {
      await _ensureDbConnected();
      
      final now = DateTime.now();
      final trainingData = training.copyWith(
        createdAt: now,
        updatedAt: now,
      ).toMap();
      
      final objectId = await _databaseService.insert(
        TRAININGS_COLLECTION,
        trainingData,
      );
      
      // Update caches
      await _refreshAllCaches();
      
      return objectId.toHexString();
    } catch (e) {
      print('Error adding training: $e');
      rethrow;
    }
  }
  
  // Update training (admin only)
  Future<bool> updateTraining(String id, Map<String, dynamic> updates) async {
    try {
      await _ensureDbConnected();
      
      updates['updatedAt'] = DateTime.now();
      
      final result = await _databaseService.updateById(
        TRAININGS_COLLECTION,
        id,
        updates,
      );
      
      // Update caches
      await _refreshAllCaches();
      
      return result;
    } catch (e) {
      print('Error updating training: $e');
      rethrow;
    }
  }
  
  // Delete training (admin only)
  Future<bool> deleteTraining(String id) async {
    try {
      await _ensureDbConnected();
      
      // Soft delete - mark as inactive
      final result = await _databaseService.updateById(
        TRAININGS_COLLECTION,
        id,
        {
          'isActive': false,
          'updatedAt': DateTime.now(),
        },
      );
      
      // Update caches
      await _refreshAllCaches();
      
      return result;
    } catch (e) {
      print('Error deleting training: $e');
      rethrow;
    }
  }
  
  // Get registrations for a training with user details
  Future<List<RegisteredPersonnel>> getTrainingRegistrations(String trainingId) async {
    try {
      await _ensureDbConnected();
      
      final cleanTrainingId = _cleanObjectIdString(trainingId);
      final trainingObjectId = mongo.ObjectId.fromHexString(cleanTrainingId);
      
      final registrations = await _databaseService.find(
        REGISTRATIONS_COLLECTION,
        filter: {
          'trainingId': trainingObjectId,
          'status': 'registered',
        },
      );
      
      if (registrations.isEmpty) {
        return [];
      }
      
      // Get user details for each registration
      List<RegisteredPersonnel> registeredPersonnel = [];
      
      for (var registration in registrations) {
        final userId = registration['userId'] as mongo.ObjectId;
        
        // Fetch user info from the users collection
        final userDoc = await _databaseService.findOne(
          'personnels', // Using the correct collection name for users
          filter: {'_id': userId},
        );
        
        if (userDoc != null) {
          final Map<String, dynamic> combined = {
            'registration': registration,
            'user': {
              'id': userDoc['_id'],
              'firstName': userDoc['firstName'] ?? '',
              'lastName': userDoc['lastName'] ?? '',
              'rank': userDoc['rank'] ?? '',
              'serialNumber': userDoc['serialNumber'] ?? userDoc['serviceNumber'] ?? '',
            },
          };
          
          registeredPersonnel.add(RegisteredPersonnel.fromMap(combined));
        }
      }
      
      return registeredPersonnel;
    } catch (e) {
      print('Error fetching training registrations: $e');
      rethrow;
    }
  }
  
  // Mark attendance (admin only)
  Future<bool> markAttendance(String registrationId, bool attended) async {
    try {
      await _ensureDbConnected();
      
      final now = DateTime.now();
      
      final result = await _databaseService.updateById(
        REGISTRATIONS_COLLECTION,
        registrationId,
        {
          'status': attended ? 'attended' : 'absent',
          'attendanceDate': attended ? now : null,
          'updatedAt': now,
        },
      );
      
      // Update caches
      await _refreshAllCaches();
      
      return result;
    } catch (e) {
      print('Error marking attendance: $e');
      rethrow;
    }
  }
  
  // Mark completion (admin only)
  Future<bool> markCompletion(
    String registrationId, {
    required bool completed,
    int? score,
    String? feedback,
    String? certificate,
  }) async {
    try {
      await _ensureDbConnected();
      
      final now = DateTime.now();
      
      final updates = {
        'status': completed ? 'completed' : 'attended',
        'completionDate': completed ? now : null,
        'updatedAt': now,
      };
      
      if (score != null) {
        updates['score'] = score;
      }
      
      if (feedback != null) {
        updates['feedback'] = feedback;
      }
      
      if (certificate != null) {
        updates['certificate'] = certificate;
      }
      
      final result = await _databaseService.updateById(
        REGISTRATIONS_COLLECTION,
        registrationId,
        updates,
      );
      
      // Update caches
      await _refreshAllCaches();
      
      return result;
    } catch (e) {
      print('Error marking completion: $e');
      rethrow;
    }
  }
  
  // Refresh caches after data changes
  Future<void> _refreshCaches(String userId) async {
    // Clear registration cache for this user
    final cleanUserId = _cleanObjectIdString(userId);
    _registrationStatusCache.removeWhere((key, _) => key.startsWith(cleanUserId));
    _registrationCacheTimestamps.removeWhere((key, _) => key.startsWith(cleanUserId));
    
    // Force refresh of the user's trainings - clear the cache entry to ensure a fresh reload
    _userTrainings.remove(cleanUserId);
    
    await Future.wait([
      getUpcomingTrainings(),
      getOngoingTrainings(),
      getPastTrainings(),
      getUserTrainings(userId), // Fetch fresh user trainings
    ]);
    
    // Notify listeners to update UI
    notifyListeners();
  }
  
  // Special method to handle test data - Move 2025 trainings to past
  Future<void> moveTestDataToPast() async {
    // This method is now deprecated - 2025 trainings should no longer be forced to past
    // We'll just refresh the caches to ensure data is up to date
      await _refreshAllCaches();
  }
  
  // Refresh all caches (for admin actions that affect multiple users)
  Future<void> _refreshAllCaches() async {
    // Clear registration cache completely
    _registrationStatusCache.clear();
    _registrationCacheTimestamps.clear();
    
    await Future.wait([
      getUpcomingTrainings(),
      getOngoingTrainings(),
      getPastTrainings(),
    ]);
    
    // User trainings will refresh on next access
    _userTrainings.clear();
    notifyListeners();
  }

  // Helper method to clear user trainings cache
  void _clearUserTrainingsCache(String userId) {
    final cleanUserId = _cleanObjectIdString(userId);
    _userTrainings.remove(cleanUserId);
    
    // Clear registration status cache for this user
    final userPrefix = '${cleanUserId}_';
    _registrationStatusCache.removeWhere((key, _) => key.startsWith(userPrefix));
    _registrationCacheTimestamps.removeWhere((key, _) => key.startsWith(userPrefix));
    
    notifyListeners();
  }

  // Method to mark a training as completed for a user
  Future<bool> markTrainingAsCompleted(String userId, String trainingId, {double? score}) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Authentication token not available');
      }

      final url = Uri.parse('$baseUrl/api/trainings/complete');
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'userId': userId,
          'trainingId': trainingId,
          'score': score,
        }),
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true) {
          // Clear cache to force refresh on next fetch
          _clearUserTrainingsCache(userId);
          
          // Return success
          return true;
        }
      }
      
      // Parse error message if available
      if (response.statusCode >= 400) {
        try {
          final jsonResponse = jsonDecode(response.body);
          throw Exception(jsonResponse['error'] ?? 'Failed to mark training as completed');
        } catch (e) {
          throw Exception('Failed to mark training as completed: ${response.statusCode}');
        }
      }
      
      return false;
    } catch (e) {
      print('Error marking training as completed: $e');
      rethrow;
    }
  }
} 