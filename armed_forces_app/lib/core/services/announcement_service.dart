import 'package:flutter/foundation.dart';
import 'package:mongo_dart/mongo_dart.dart';
import '../models/announcement_model.dart';
import '../config/mongodb_config.dart';
import './mongodb_service.dart';

class AnnouncementService extends ChangeNotifier {
  final MongoDBService _mongoDBService = MongoDBService();
  bool _isConnected = false;
  
  // Initialize and connect to MongoDB
  Future<void> _initConnection() async {
    if (!_isConnected) {
      await _mongoDBService.connect();
      _isConnected = _mongoDBService.isConnected;
    }
  }

  // Methods to manage announcements
  Future<List<Announcement>> getAnnouncements() async {
    try {
      await _initConnection();
      
      if (!_isConnected) {
        if (kDebugMode) {
          print('MongoDB connection failed. Using mock data for announcements.');
        }
        return _getMockAnnouncements();
      }
      
      final collection = _mongoDBService.getCollection(MongoDBConfig.announcementCollection);
      final List<Map<String, dynamic>> result = await collection
          .find()
          .map((doc) => doc)
          .toList();
      
      if (kDebugMode) {
        print('DEBUG: Retrieved ${result.length} announcements from MongoDB');
        for (var doc in result) {
          print('DEBUG: Announcement document: $doc');
        }
      }
      
      final announcements = <Announcement>[];
      for (var doc in result) {
        try {
          announcements.add(_mapToAnnouncement(doc));
        } catch (e) {
          if (kDebugMode) {
            print('DEBUG: Error mapping announcement: $e for document: $doc');
          }
        }
      }
      
      if (announcements.isEmpty) {
        if (kDebugMode) {
          print('No valid announcements found in database. Using mock data.');
        }
        return _getMockAnnouncements();
      }
      
      return announcements;
    } catch (e) {
      if (kDebugMode) {
        print('Error fetching announcements: $e');
      }
      // Return mock data as fallback
      return _getMockAnnouncements();
    }
  }

  Future<Announcement?> getAnnouncement(String id) async {
    try {
      await _initConnection();
      
      if (!_isConnected) {
        if (kDebugMode) {
          print('MongoDB connection failed. Using mock data for a single announcement.');
        }
        final mockData = _getMockAnnouncements();
        return mockData.firstWhere((a) => a.id == id, orElse: () => mockData.first);
      }
      
      final collection = _mongoDBService.getCollection(MongoDBConfig.announcementCollection);
      final result = await collection.findOne(where.eq('_id', ObjectId.parse(id)));
      
      if (result == null) return null;
      
      return _mapToAnnouncement(result);
    } catch (e) {
      if (kDebugMode) {
        print('Error fetching announcement: $e');
      }
      return null;
    }
  }

  Future<void> createAnnouncement(Announcement announcement) async {
    try {
      await _initConnection();
      
      if (!_isConnected) {
        if (kDebugMode) {
          print('MongoDB connection failed. Cannot create announcement.');
        }
        return;
      }
      
      final collection = _mongoDBService.getCollection(MongoDBConfig.announcementCollection);
      
      await collection.insert({
        'title': announcement.title,
        'content': announcement.content,
        'date': announcement.date.toIso8601String(),
        'isImportant': announcement.isImportant,
        'targetType': announcement.targetType,
        'targetId': announcement.targetId,
        'createdBy': announcement.createdBy,
        'imageUrl': announcement.imageUrl,
        'documentUrl': announcement.documentUrl,
        'createdAt': DateTime.now().toIso8601String(),
        'updatedAt': DateTime.now().toIso8601String(),
      });
      
      notifyListeners();
    } catch (e) {
      if (kDebugMode) {
        print('Error creating announcement: $e');
      }
    }
  }

  Future<void> updateAnnouncement(Announcement announcement) async {
    try {
      await _initConnection();
      
      if (!_isConnected) {
        if (kDebugMode) {
          print('MongoDB connection failed. Cannot update announcement.');
        }
        return;
      }
      
      final collection = _mongoDBService.getCollection(MongoDBConfig.announcementCollection);
      
      await collection.update(
        where.eq('_id', ObjectId.parse(announcement.id)),
        {
          '\$set': {
            'title': announcement.title,
            'content': announcement.content,
            'date': announcement.date.toIso8601String(),
            'isImportant': announcement.isImportant,
            'targetType': announcement.targetType,
            'targetId': announcement.targetId,
            'createdBy': announcement.createdBy,
            'imageUrl': announcement.imageUrl,
            'documentUrl': announcement.documentUrl,
            'updatedAt': DateTime.now().toIso8601String(),
          }
        },
      );
      
      notifyListeners();
    } catch (e) {
      if (kDebugMode) {
        print('Error updating announcement: $e');
      }
    }
  }

  Future<void> deleteAnnouncement(String id) async {
    try {
      await _initConnection();
      
      if (!_isConnected) {
        if (kDebugMode) {
          print('MongoDB connection failed. Cannot delete announcement.');
        }
        return;
      }
      
      final collection = _mongoDBService.getCollection(MongoDBConfig.announcementCollection);
      await collection.remove(where.eq('_id', ObjectId.parse(id)));
      
      notifyListeners();
    } catch (e) {
      if (kDebugMode) {
        print('Error deleting announcement: $e');
      }
    }
  }

  // Get important announcements
  Future<List<Announcement>> getImportantAnnouncements() async {
    try {
      await _initConnection();
      
      if (!_isConnected) {
        if (kDebugMode) {
          print('MongoDB connection failed. Using mock data for important announcements.');
        }
        final mockData = _getMockAnnouncements();
        return mockData.where((a) => a.isImportant).toList();
      }
      
      final collection = _mongoDBService.getCollection(MongoDBConfig.announcementCollection);
      final List<Map<String, dynamic>> result = await collection
          .find(where.eq('isImportant', true))
          .map((doc) => doc)
          .toList();
      
      return result.map((doc) => _mapToAnnouncement(doc)).toList();
    } catch (e) {
      if (kDebugMode) {
        print('Error fetching important announcements: $e');
      }
      // Return mock data as fallback
      final mockData = _getMockAnnouncements();
      return mockData.where((a) => a.isImportant).toList();
    }
  }

  // Get recent announcements (last 7 days)
  Future<List<Announcement>> getRecentAnnouncements() async {
    try {
      await _initConnection();
      
      if (!_isConnected) {
        if (kDebugMode) {
          print('MongoDB connection failed. Using mock data for recent announcements.');
        }
        final mockData = _getMockAnnouncements();
        final DateTime sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7));
        return mockData.where((a) => a.date.isAfter(sevenDaysAgo)).toList();
      }
      
      final collection = _mongoDBService.getCollection(MongoDBConfig.announcementCollection);
      final DateTime sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7));
      
      final List<Map<String, dynamic>> result = await collection
          .find(where.gt('date', sevenDaysAgo.toIso8601String()))
          .map((doc) => doc)
          .toList();
      
      return result.map((doc) => _mapToAnnouncement(doc)).toList();
    } catch (e) {
      if (kDebugMode) {
        print('Error fetching recent announcements: $e');
      }
      // Return mock data as fallback
      final mockData = _getMockAnnouncements();
      final DateTime sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7));
      return mockData.where((a) => a.date.isAfter(sevenDaysAgo)).toList();
    }
  }

  // Helper method to convert MongoDB document to Announcement model
  Announcement _mapToAnnouncement(Map<String, dynamic> doc) {
    try {
      // Convert ObjectId to string if necessary
      final id = doc['_id'] is ObjectId 
          ? (doc['_id'] as ObjectId).toHexString() 
          : doc['_id'].toString();
      
      // Ensure required fields exist or use defaults
      final title = doc['title'] as String? ?? 'Untitled Announcement';
      final content = doc['content'] as String? ?? 'No content available';
      
      // Handle date parsing with fallback
      DateTime date;
      try {
        date = doc['date'] is DateTime 
            ? doc['date'] as DateTime 
            : doc['date'] != null 
                ? DateTime.parse(doc['date'].toString())
                : DateTime.now();
      } catch (e) {
        date = DateTime.now();
        if (kDebugMode) {
          print('DEBUG: Error parsing date, using current date: $e');
        }
      }
      
      // Safely convert other fields
      final isImportant = doc['isImportant'] as bool? ?? false;
      final imageUrl = doc['imageUrl'] as String?;
      final documentUrl = doc['documentUrl'] as String?;
      
      // Handle createdBy, could be ObjectId or String
      String? createdBy;
      if (doc['createdBy'] != null) {
        createdBy = doc['createdBy'] is ObjectId 
            ? (doc['createdBy'] as ObjectId).toHexString() 
            : doc['createdBy'].toString();
      }
      
      final targetType = doc['targetType'] as String?;
      final targetId = doc['targetId'] as String?;
      
      // Handle timestamps with fallbacks
      DateTime? createdAt;
      if (doc['createdAt'] != null) {
        try {
          createdAt = doc['createdAt'] is DateTime 
              ? doc['createdAt'] as DateTime 
              : DateTime.parse(doc['createdAt'].toString());
        } catch (e) {
          if (kDebugMode) {
            print('DEBUG: Error parsing createdAt: $e');
          }
        }
      }
      
      DateTime? updatedAt;
      if (doc['updatedAt'] != null) {
        try {
          updatedAt = doc['updatedAt'] is DateTime 
              ? doc['updatedAt'] as DateTime 
              : DateTime.parse(doc['updatedAt'].toString());
        } catch (e) {
          if (kDebugMode) {
            print('DEBUG: Error parsing updatedAt: $e');
          }
        }
      }
      
      return Announcement(
        id: id,
        title: title,
        content: content,
        date: date,
        isImportant: isImportant,
        imageUrl: imageUrl,
        documentUrl: documentUrl,
        createdBy: createdBy,
        targetType: targetType,
        targetId: targetId,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );
    } catch (e) {
      if (kDebugMode) {
        print('ERROR during announcement mapping: $e');
        print('Document that caused error: $doc');
      }
      // Create a fallback announcement if mapping fails
      return Announcement(
        id: doc['_id']?.toString() ?? 'unknown_id',
        title: 'Error Loading Announcement',
        content: 'There was an error loading this announcement.',
        date: DateTime.now(),
      );
    }
  }

  // Mock data for fallback when DB connection fails
  List<Announcement> _getMockAnnouncements() {
    return [
    Announcement(
      id: '1',
      title: 'Annual Training Schedule Released',
      content: 'The annual training schedule for 2024 has been released. Please check your training tab for details.',
      date: DateTime.now().subtract(const Duration(days: 2)),
      isImportant: true,
      targetType: 'training',
      targetId: '1',
    ),
    Announcement(
      id: '2',
      title: 'New Document Requirements',
      content: 'All personnel must upload updated medical certificates by the end of the month.',
      date: DateTime.now().subtract(const Duration(days: 5)),
      isImportant: false,
      targetType: 'document',
      targetId: 'medical_certificates',
    ),
    Announcement(
      id: '3',
      title: 'System Maintenance',
      content: 'The system will be undergoing maintenance this weekend. Some features may be unavailable.',
      date: DateTime.now().subtract(const Duration(days: 7)),
      isImportant: false,
      targetType: 'notification',
    ),
  ];
  }
} 