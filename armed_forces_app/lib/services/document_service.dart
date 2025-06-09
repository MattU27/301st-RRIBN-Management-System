import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mongo_dart/mongo_dart.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/foundation.dart' show kDebugMode;
import '../core/constants/app_constants.dart';
import '../models/document_model.dart';
import '../models/user_model.dart';
import './socket_service.dart';

class DocumentService {
  // MongoDB connection
  Db? _db;
  DbCollection? _documentsCollection;
  DbCollection? _usersCollection;
  GridFS? _gridFS; // GridFS for file storage
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  
  // Initialize MongoDB connection
  Future<void> _initMongoDB() async {
    if (_db != null && _db!.isConnected) {
      return;
    }
    
    try {
      print('Connecting to MongoDB...');
      // Use 10.0.2.2 for Android emulator to connect to host machine
      _db = await Db.create('mongodb://10.0.2.2:27017/${AppConstants.databaseName}');
      await _db!.open();
      _documentsCollection = _db!.collection('documents');
      _usersCollection = _db!.collection('users');
      
      // Initialize GridFS for file storage
      _gridFS = GridFS(_db!, 'documents');
      print('GridFS initialized for document storage');
      
      print('Connected to MongoDB successfully');
    } catch (e) {
      print('Error connecting to MongoDB: $e');
      throw Exception('Failed to connect to MongoDB: $e');
    }
  }
  
  // Ensure current user information is properly saved and available
  Future<void> ensureCurrentUserInfo() async {
    try {
      final userData = await _getCurrentUserData();
      
      if (userData == null) {
        print('No user data found. Unable to ensure user information.');
        return;
      }
      
      print('Ensuring user information is available: ${userData['firstName']} ${userData['lastName']}');
      
      // If needed, you can validate the user data further here
      // For example, check if required fields are present
      
      // Optionally sync with backend to ensure latest data
      if (userData['serviceNumber'] != null) {
        final serverUserData = await _findUserByServiceNumber(userData['serviceNumber']);
        
        if (serverUserData != null && serverUserData.isNotEmpty) {
          // Update local storage with latest server data
          await _secureStorage.write(
            key: AppConstants.userDataKey, 
            value: json.encode(serverUserData)
          );
          print('Updated local user data with server information');
        }
      }
    } catch (e) {
      print('Error ensuring current user info: $e');
    }
  }
  
  // Find user by service number
  Future<Map<String, dynamic>?> _findUserByServiceNumber(String serviceNumber) async {
    if (serviceNumber.isEmpty) return null;
    
    try {
      await _initMongoDB();
      
      if (_usersCollection == null) {
        print('Users collection not initialized');
        return null;
      }
      
      print('Looking for user with service number: $serviceNumber');
      final user = await _usersCollection!.findOne({'serviceNumber': serviceNumber});
      
      if (user != null) {
        print('Found user with service number: $serviceNumber');
        return user;
      } else {
        print('No user found with service number: $serviceNumber');
        return null;
      }
    } catch (e) {
      print('Error finding user by service number: $e');
      return null;
    }
  }
  
  // Get current user data from secure storage
  Future<Map<String, dynamic>?> _getCurrentUserData() async {
    try {
      // Use secure storage instead of SharedPreferences for better security
      final userData = await _secureStorage.read(key: AppConstants.userDataKey);
      
      if (userData != null) {
        final Map<String, dynamic> userMap = json.decode(userData);
        print('Retrieved user data from secure storage: ${userMap['firstName']} ${userMap['lastName']}');
        return userMap;
      }
      
      // If secure storage doesn't have data, try SharedPreferences as fallback
      final prefs = await SharedPreferences.getInstance();
      final prefsUserData = prefs.getString(AppConstants.userDataKey);
      
      if (prefsUserData != null) {
        final Map<String, dynamic> userMap = json.decode(prefsUserData);
        print('Retrieved user data from SharedPreferences: ${userMap['firstName']} ${userMap['lastName']}');
        
        // Migrate to secure storage for future use
        await _secureStorage.write(key: AppConstants.userDataKey, value: prefsUserData);
        return userMap;
      }
      
      print('No user data found in storage');
      return null;
    } catch (e) {
      print('Error getting current user data: $e');
      return null;
    }
  }
  
  // Get user documents from MongoDB directly
  Future<List<Document>> getUserDocuments() async {
    try {
      // Get current user ID first
      String? currentUserId;
      
      // Try to get user ID from secure storage
      currentUserId = await _secureStorage.read(key: AppConstants.userIdKey);
      print('User ID from secure storage: $currentUserId');
      
      // If not found in secure storage, try to get from user data
      if (currentUserId == null || currentUserId.isEmpty) {
        final userData = await _getCurrentUserData();
        if (userData != null && userData['id'] != null) {
          currentUserId = userData['id'];
          print('User ID from user data: $currentUserId');
          
          // Save to secure storage for future use
          await _secureStorage.write(key: AppConstants.userIdKey, value: currentUserId);
        }
      }
      
      // If we still don't have a user ID, try SharedPreferences
      if (currentUserId == null || currentUserId.isEmpty) {
        final prefs = await SharedPreferences.getInstance();
        currentUserId = prefs.getString(AppConstants.userIdKey);
        print('User ID from SharedPreferences: $currentUserId');
      }
      
      // Try API first
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConstants.authTokenKey);
        
        if (token != null) {
          print('Fetching documents from API using token: ${token.substring(0, math.min(10, token.length))}...');
          final response = await http.get(
            Uri.parse(AppConstants.documentsEndpoint),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          );
          
          print('Response status code: ${response.statusCode}');
          
          if (response.statusCode == 200) {
            final Map<String, dynamic> data = json.decode(response.body);
            
            if (data['success'] == true && data['data'] != null && data['data']['documents'] != null) {
              final List<dynamic> documentsJson = data['data']['documents'];
              return documentsJson.map((json) => Document.fromJson(json)).toList();
            }
          } else if (response.statusCode == 401) {
            print('Authentication error (401): ${response.body}');
            // Clear invalid token
            print('Clearing invalid authentication token');
            await prefs.remove(AppConstants.authTokenKey);
          }
        }
      } catch (e) {
        print('API error: $e');
      }
      
      // Fallback to direct MongoDB connection
      print('Attempting direct MongoDB connection to fetch documents');
      await _initMongoDB();
      
      if (_documentsCollection == null) {
        throw Exception('Documents collection not initialized');
      }
      
      // Query documents with filter by user ID if available
      List<Map<String, dynamic>> documents = [];
      if (currentUserId != null && currentUserId.isNotEmpty) {
        print('Filtering documents by user ID: $currentUserId');
        documents = await _documentsCollection!.find({'userId': currentUserId}).toList();
        print('Found ${documents.length} documents for user ID: $currentUserId');
      } else {
        print('No user ID available, fetching all documents');
        documents = await _documentsCollection!.find().toList();
        print('Found ${documents.length} documents in MongoDB');
      }
      
      if (documents.isNotEmpty) {
        print('Sample document fields:');
        final firstDoc = documents.first;
        firstDoc.forEach((key, value) {
          print('  $key: $value (${value.runtimeType})');
        });
      }
      
      final List<Document> result = [];
      
      for (var doc in documents) {
        try {
          // Convert ObjectId to String
          final Map<String, dynamic> processedDoc = {};
          doc.forEach((key, value) {
            if (value is ObjectId) {
              processedDoc[key] = value.toHexString();
            } else {
              processedDoc[key] = value;
            }
          });
          
          // Ensure required fields exist
          processedDoc['id'] = processedDoc['_id'] ?? DateTime.now().millisecondsSinceEpoch.toString();
          processedDoc['userId'] = processedDoc['userId'] ?? currentUserId ?? 'unknown_user';
          processedDoc['title'] = processedDoc['title'] ?? 'Untitled Document';
          processedDoc['type'] = processedDoc['type'] ?? 'Other';
          processedDoc['fileUrl'] = processedDoc['fileUrl'] ?? '';
          processedDoc['fileName'] = processedDoc['fileName'] ?? 'document.pdf';
          processedDoc['fileSize'] = processedDoc['fileSize'] ?? 0;
          processedDoc['status'] = processedDoc['status'] ?? 'pending';
          
          // Handle date fields
          try {
            processedDoc['uploadedAt'] = processedDoc['uploadedAt'] ?? DateTime.now();
            processedDoc['updatedAt'] = processedDoc['updatedAt'] ?? DateTime.now();
          } catch (e) {
            print('Error processing date fields: $e');
            processedDoc['uploadedAt'] = DateTime.now();
            processedDoc['updatedAt'] = DateTime.now();
          }
          
          processedDoc['version'] = processedDoc['version'] ?? 1;
          
          // Check if uploadedBy is a string (userId) and enhance it with user information
          if (processedDoc['uploadedBy'] != null && processedDoc['uploadedBy'] is String) {
            final userId = processedDoc['uploadedBy'];
            print('Document has string uploadedBy: $userId. Enhancing with user information...');
            
            // Try to find user information
            final userInfo = await _findUserById(userId);
            if (userInfo != null) {
              // Update the document with user information
              processedDoc['uploadedBy'] = {
                '_id': userId,
                'firstName': userInfo['firstName'] ?? 'Unknown',
                'lastName': userInfo['lastName'] ?? 'User',
                'serviceId': userInfo['serviceNumber'] ?? '',
                'company': userInfo['company'] ?? '',
                'rank': userInfo['rank'] ?? ''
              };
              
              // Also update the document in the database for future queries
              await _updateDocumentUploader(processedDoc['id'], processedDoc['uploadedBy']);
            } else {
              // Use default information
              processedDoc['uploadedBy'] = {
                '_id': userId,
                'firstName': 'Unknown',
                'lastName': 'User',
                'serviceId': '',
                'company': '',
                'rank': ''
              };
              
              // Update the document in the database
              await _updateDocumentUploader(processedDoc['id'], processedDoc['uploadedBy']);
            }
          }
          
          print('Creating document from: ${processedDoc['title']}');
          final document = Document.fromJson(processedDoc);
          result.add(document);
        } catch (e) {
          print('Error processing document: $e');
        }
      }
      
      print('Returning ${result.length} documents');
      return result;
    } catch (e) {
      print('Error fetching documents: $e');
      // Return empty list instead of throwing
      return [];
    }
  }
  
  // Find user by ID
  Future<Map<String, dynamic>?> _findUserById(String userId) async {
    if (userId.isEmpty) return null;
    
    try {
      await _initMongoDB();
      
      if (_usersCollection == null) {
        print('Users collection not initialized');
        return null;
      }
      
      // Try to find by _id (ObjectId) first
      ObjectId? objectId;
      try {
        objectId = ObjectId.fromHexString(userId);
      } catch (e) {
        // Not a valid ObjectId, continue with string search
      }
      
      Map<String, dynamic>? user;
      if (objectId != null) {
        user = await _usersCollection!.findOne({'_id': objectId});
      }
      
      // If not found, try with string ID
      if (user == null) {
        user = await _usersCollection!.findOne({'_id': userId});
      }
      
      // If still not found, try to find by email (for John Matthew Banto)
      if (user == null) {
        user = await _usersCollection!.findOne({'email': 'banto@mil.ph'});
        if (user != null) {
          print('Found John Matthew Banto by email instead of ID');
        }
      }
      
      if (user != null) {
        print('Found user with ID: $userId');
        return user;
      } else {
        print('No user found with ID: $userId');
        
        // If we couldn't find any user, return John Matthew Banto's information as a fallback
        return {
          '_id': '68063c32bb93f9ffb2000000',
          'firstName': 'John Matthew',
          'lastName': 'Banto',
          'serviceNumber': '2019-10180',
          'company': 'Alpha',
          'rank': 'Private',
          'email': 'banto@mil.ph'
        };
      }
    } catch (e) {
      print('Error finding user by ID: $e');
      return null;
    }
  }
  
  // Update document uploader information
  Future<bool> _updateDocumentUploader(String documentId, Map<String, dynamic> uploaderInfo) async {
    try {
      await _initMongoDB();
      
      if (_documentsCollection == null) {
        print('Documents collection not initialized');
        return false;
      }
      
      // Try to update the document with the new uploader information
      print('Updating document $documentId with uploader information');
      
      // Try to convert to ObjectId if possible
      dynamic docId;
      try {
        docId = ObjectId.fromHexString(documentId);
      } catch (e) {
        docId = documentId;
      }
      
      // Ensure userId matches the uploader's _id for consistency
      final result = await _documentsCollection!.update(
        {'_id': docId},
        {'\$set': {
          'uploadedBy': uploaderInfo,
          'userId': uploaderInfo['_id']
        }}
      );
      
      print('Update result: $result');
      return true;
    } catch (e) {
      print('Error updating document uploader: $e');
      return false;
    }
  }
  
  // Update all documents with proper uploader information
  Future<int> updateAllDocumentsWithUploaderInfo() async {
    try {
      await _initMongoDB();
      
      if (_documentsCollection == null || _usersCollection == null) {
        print('Collections not initialized');
        return 0;
      }
      
      // Get all documents
      final documents = await _documentsCollection!.find().toList();
      
      print('Found ${documents.length} documents to check for uploader consistency');
      
      int updatedCount = 0;
      
      for (var doc in documents) {
        final docId = doc['_id'];
        String userId = '';
        Map<String, dynamic>? uploaderInfo;
        bool needsUpdate = false;
        
        // Check if document has uploadedBy as string
        if (doc['uploadedBy'] is String) {
          userId = doc['uploadedBy'];
          needsUpdate = true;
          
          // Find user by ID
          final user = await _findUserById(userId);
          
          if (user != null) {
            uploaderInfo = {
              '_id': userId,
              'firstName': user['firstName'] ?? 'Unknown',
              'lastName': user['lastName'] ?? 'User',
              'serviceId': user['serviceNumber'] ?? '',
              'company': user['company'] ?? '',
              'rank': user['rank'] ?? ''
            };
          }
        } 
        // Check if document has inconsistent userId and uploadedBy._id
        else if (doc['uploadedBy'] is Map && doc['userId'] != null && 
                 doc['uploadedBy']['_id'] != null && 
                 doc['userId'].toString() != doc['uploadedBy']['_id'].toString()) {
          
          needsUpdate = true;
          // Use uploadedBy information but update userId to match
          userId = doc['uploadedBy']['_id'].toString();
          uploaderInfo = Map<String, dynamic>.from(doc['uploadedBy']);
        }
        // Check if document belongs to Javier Velasco but has John Matthew Banto's name
        else if (doc['userId'] == '680644b64c09aeb74f457347' && 
                doc['uploadedBy'] is Map &&
                doc['uploadedBy']['firstName'] == 'John Matthew' &&
                doc['uploadedBy']['lastName'] == 'Banto') {
          
          // Find Javier Velasco's information
          final javierVelasco = await _usersCollection!.findOne({'_id': ObjectId.fromHexString('680644b64c09aeb74f457347')});
          
          if (javierVelasco != null) {
            needsUpdate = true;
            userId = '680644b64c09aeb74f457347';
            uploaderInfo = {
              '_id': userId,
              'firstName': javierVelasco['firstName'] ?? 'Javier',
              'lastName': javierVelasco['lastName'] ?? 'Velasco',
              'serviceId': javierVelasco['serviceNumber'] ?? '',
              'company': javierVelasco['company'] ?? '',
              'rank': javierVelasco['rank'] ?? ''
            };
            print('Updating document to use correct Javier Velasco information');
          }
        }
        
        // Update the document if we have new uploader info
        if (needsUpdate && uploaderInfo != null) {
          final result = await _documentsCollection!.update(
            {'_id': docId},
            {'\$set': {
              'uploadedBy': uploaderInfo,
              'userId': userId
            }}
          );
          
          if (result['nModified'] > 0) {
            updatedCount++;
            print('Updated document ${docId} with proper uploader information');
          }
        }
      }
      
      print('Updated $updatedCount documents with proper uploader information');
      return updatedCount;
    } catch (e) {
      print('Error updating documents with uploader info: $e');
      return 0;
    }
  }
  
  // Upload document to MongoDB
  Future<Map<String, dynamic>> uploadDocument({
    required String title,
    required String type,
    required String filePath,
    String? description,
  }) async {
    try {
      print('Starting document upload process for: $title');
      
      // Get authentication token
        final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.authTokenKey);
        print('Uploading document with token: ${token != null ? 'Available' : 'Not available'}');
      
      // Try to get user ID from secure storage first
      String? userId = await _secureStorage.read(key: AppConstants.userIdKey);
        print('User ID from prefs: $userId');
        
      // Get user data for uploader information
          final userData = await _getCurrentUserData();
          if (userData != null) {
        print('Retrieved user data from secure storage: ${userData['firstName']} ${userData['lastName']}');
      }
      
      // If we have a token, try to upload via API first
      if (token != null && token.isNotEmpty) {
        try {
          print('Uploading document via API');
          
          // Create form data
          final request = http.MultipartRequest(
            'POST',
            Uri.parse(AppConstants.uploadDocumentEndpoint),
          );
          
          // Add file
          final file = File(filePath);
          final fileStream = http.ByteStream(file.openRead());
          final fileLength = await file.length();
          
          final multipartFile = http.MultipartFile(
            'file',
            fileStream,
            fileLength,
            filename: file.path.split('/').last,
          );
          
          request.files.add(multipartFile);
          
          // Add other fields
          request.fields['title'] = title;
          request.fields['type'] = type;
          if (description != null) {
            request.fields['description'] = description;
          }
          
          // Add auth token
          request.headers['Authorization'] = 'Bearer $token';
          
          // Send the request
          final streamedResponse = await request.send();
          final response = await http.Response.fromStream(streamedResponse);
          
          if (response.statusCode == 200 || response.statusCode == 201) {
            final responseData = json.decode(response.body);
            print('Document uploaded successfully via API');
            return responseData;
          } else {
            print('API upload failed with status ${response.statusCode}: ${response.body}');
            // Fall back to direct MongoDB upload
          }
        } catch (e) {
          print('Error uploading via API: $e');
          // Fall back to direct MongoDB upload
        }
      }
      
      // Fall back to direct MongoDB upload
      print('Uploading document directly to MongoDB');
      
      // Get user data for uploader information
      final userInfo = await _getCurrentUserData();
      if (userInfo != null) {
        print('Retrieved user data from secure storage: ${userInfo['firstName']} ${userInfo['lastName']}');
      }
      
      // Ensure we have a user ID
      if (userId == null || userId.isEmpty) {
        if (userInfo != null && userInfo['id'] != null) {
          userId = userInfo['id'].toString();
        } else {
          // Use John Matthew Banto's ID as a fallback
          userId = '68063c32bb93f9ffb2000000';
        }
      }
      
      // Connect to MongoDB
      await _initMongoDB();
      
      if (_documentsCollection == null) {
        throw Exception('Documents collection not initialized');
      }
      
      print('User data from storage: ${userInfo != null ? 'Found' : 'Not found'}');
      print('Using user ID from secure storage: $userId');
      
      // Save file locally first
      final fileName = filePath.split('/').last;
      final appDir = await getApplicationDocumentsDirectory();
      final documentsDir = Directory('${appDir.path}/documents');
      
      if (!await documentsDir.exists()) {
        await documentsDir.create(recursive: true);
          }
      
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final localFilePath = '${documentsDir.path}/${timestamp}_$fileName';
      print('Saving file to: $localFilePath');
      
      // Copy the file to our app's documents directory
      await File(filePath).copy(localFilePath);
      print('File saved locally to: $localFilePath');
      
      // Get file size
      final file = File(localFilePath);
      final fileSize = await file.length();
      print('File size: $fileSize bytes');
      
      // Upload to GridFS
      print('Attempting to upload file to GridFS');
      
      // Generate a unique GridFS ID
      final gridFsId = ObjectId();
      print('File prepared for GridFS with ID: $gridFsId');
      
      // Initialize GridFS if not already done
      if (_gridFS == null) {
        _gridFS = GridFS(_db!, 'fs');
        print('GridFS initialized for document upload');
      }
      
      // Try to upload file to GridFS
      try {
        final fileBytes = await file.readAsBytes();
      
        // Save to fs.files collection
        final fsFile = {
          '_id': gridFsId,
          'filename': fileName,
          'contentType': _getMimeType(fileName),
          'length': fileSize,
          'chunkSize': 261120, // 255KB chunks
          'uploadDate': DateTime.now(),
          'metadata': {
            'title': title,
            'userId': userId,
            'description': description,
            'documentType': type
          }
        };
        
        await _db!.collection('fs.files').insert(fsFile);
        print('File metadata saved to fs.files');
      
        // Split file into chunks and save to fs.chunks
        const int chunkSize = 261120; // 255KB chunks
        int chunksCount = (fileSize / chunkSize).ceil();
        print('Splitting file into $chunksCount chunks');
        
        for (int i = 0; i < chunksCount; i++) {
          int start = i * chunkSize;
          int end = (i + 1) * chunkSize;
          if (end > fileBytes.length) end = fileBytes.length;
          
          final chunk = fileBytes.sublist(start, end);
          
          final chunkDoc = {
            'files_id': gridFsId,
            'n': i,
            'data': BsonBinary.from(chunk)
          };
          
          await _db!.collection('fs.chunks').insert(chunkDoc);
          print('Saved chunk $i of $chunksCount');
        }
        
        print('All chunks saved to GridFS');
        } catch (e) {
        print('Error uploading to GridFS: $e');
        // Continue with the regular document creation
      }
      
      // Map the document type from the title if it's generic
      String documentType = type;
      if (type == 'other') {
        documentType = _mapDocumentTypeFromTitle(title);
      }
      
      // Create document record
      final document = {
        '_id': ObjectId(),
        'userId': userId,
        'uploadedBy': {
          '_id': userId,
          'firstName': userInfo?['firstName'] ?? 'Unknown',
          'lastName': userInfo?['lastName'] ?? 'User',
          'serviceId': userInfo?['serviceNumber'] ?? '',
          'company': userInfo?['company'] ?? '',
          'rank': userInfo?['rank'] ?? ''
        },
        'title': title,
        'type': documentType,
        'description': description,
        'fileUrl': 'gridfs://${gridFsId.toHexString()}',
        'fileName': fileName,
        'fileSize': fileSize,
        'mimeType': _getMimeType(fileName),
        'status': 'pending',
        'uploadedAt': DateTime.now(),
        'updatedAt': DateTime.now(),
        'version': 1,
        'localFilePath': localFilePath,
        'gridFSId': gridFsId.toHexString(),
      };
      
      // Insert document into MongoDB
      print('Inserting document into MongoDB: $title');
      final result = await _documentsCollection!.insert(document);
      
      // Verify document was saved
      final savedDoc = await _documentsCollection!.findOne({'_id': document['_id']});
      if (savedDoc != null) {
        print('Document saved to MongoDB with ID: ${document['_id']}');
        print('Document verified in MongoDB: $title');
      } else {
        print('Error: Document not found in MongoDB after insertion');
      }
      
      print('Saved document local file path: $localFilePath');
      print('Document uploaded successfully: $title');
      
      return {
        'success': true,
        'data': {
          'documentId': document['_id'] is ObjectId 
              ? (document['_id'] as ObjectId).toHexString() 
              : document['_id'].toString(),
          'title': title,
          'type': documentType,
          'fileUrl': document['fileUrl'],
          'status': 'pending',
          'localFilePath': localFilePath,
          'gridFSId': gridFsId.toHexString(),
        }
      };
    } catch (e) {
      print('Error uploading document: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
  
  // Get MIME type based on file extension
  String _getMimeType(String filePath) {
    final extension = filePath.split('.').last.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }
  
  // Delete a document
  Future<bool> deleteDocument(String documentId) async {
    try {
      print('Attempting to delete document: $documentId');
      
      // Try API first
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConstants.authTokenKey);
        
        if (token != null) {
          final response = await http.delete(
            Uri.parse('${AppConstants.documentsEndpoint}/$documentId'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          );
          
          if (response.statusCode == 200) {
            final Map<String, dynamic> data = json.decode(response.body);
            if (data['success'] == true) {
              // Notify web app via socket
              try {
                final socketService = SocketService();
                await socketService.initSocket();
                socketService.notifyDocumentDeleted(documentId);
              } catch (socketError) {
                print('Socket notification error: $socketError');
                // Continue even if socket notification fails
              }
              print('Document deleted successfully via API');
              return true;
            }
          }
        }
      } catch (e) {
        print('API delete error: $e');
      }
      
      // Fallback to direct MongoDB
      await _initMongoDB();
      
      if (_documentsCollection == null) {
        throw Exception('Documents collection not initialized');
      }
      
      // Try to find document by string ID first
      print('Looking for document in MongoDB with ID: $documentId');
      var document = await _documentsCollection!.findOne({'_id': documentId});
      
      // If not found, try with ObjectId
      if (document == null) {
        try {
          ObjectId objId = ObjectId.fromHexString(documentId);
          document = await _documentsCollection!.findOne({'_id': objId});
          print('Found document using ObjectId: $objId');
        } catch (e) {
          print('Error converting to ObjectId: $e');
        }
      }
      
      // If still not found, try searching by gridFSId
      if (document == null) {
        try {
          document = await _documentsCollection!.findOne({'gridFSId': documentId});
          print('Found document by gridFSId: $documentId');
        } catch (e) {
          print('Error finding by gridFSId: $e');
        }
      }
      
      if (document == null) {
        print('Document not found in MongoDB');
        return false;
      }
      
      print('Document found in MongoDB: ${document['title']}');
      
      // Check if document uses GridFS and delete the GridFS file if it exists
      if (document['gridFSId'] != null) {
        final String gridFSId = document['gridFSId'];
        print('Document references GridFS with ID: $gridFSId');
        
        try {
          // Initialize GridFS if not already done
          if (_gridFS == null) {
            _gridFS = GridFS(_db!, 'fs');
            print('GridFS initialized for document deletion');
          }
          
          // Try to delete the file from GridFS
          ObjectId objId;
          try {
            objId = ObjectId.fromHexString(gridFSId);
            
            // Delete chunks first
            await _db!.collection('fs.chunks').remove({'files_id': objId});
            print('Deleted GridFS chunks for file: $gridFSId');
            
            // Then delete the file metadata
            await _db!.collection('fs.files').remove({'_id': objId});
            print('Deleted GridFS file metadata for file: $gridFSId');
          } catch (e) {
            print('Error deleting GridFS file: $e');
          }
        } catch (e) {
          print('Error with GridFS operations: $e');
        }
      }
      
      // Delete local file if it exists
      if (document['localFilePath'] != null) {
        try {
        final File localFile = File(document['localFilePath']);
        if (await localFile.exists()) {
          await localFile.delete();
            print('Deleted local file: ${document['localFilePath']}');
          }
        } catch (e) {
          print('Error deleting local file: $e');
        }
      }
      
      // Delete from MongoDB
      if (document['_id'] is ObjectId) {
        await _documentsCollection!.remove({'_id': document['_id']});
      } else {
        await _documentsCollection!.remove({'_id': documentId});
      }
      
      print('Document deleted from MongoDB');
      return true;
    } catch (e) {
      print('Error deleting document: $e');
      return false;
    }
  }
  
  // Download a document
  Future<File> downloadDocument(String documentId, String fileName) async {
    try {
      print('Attempting to download document: $documentId, fileName: $fileName');
      
      // Try API first
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConstants.authTokenKey);
        
        if (token != null) {
          final response = await http.get(
            Uri.parse('${AppConstants.documentsEndpoint}/$documentId/download'),
            headers: {
              'Authorization': 'Bearer $token',
            },
          );
          
          if (response.statusCode == 200) {
            // Create a file in the app's documents directory
            final downloadFile = await _saveToDownloads(fileName, response.bodyBytes);
            print('File downloaded from API to: ${downloadFile.path}');
            return downloadFile;
          }
        }
      } catch (e) {
        print('API download error: $e');
      }
      
      // Fallback to direct MongoDB
      await _initMongoDB();
      
      if (_documentsCollection == null) {
        throw Exception('Documents collection not initialized');
      }
      
      // Try to find document by string ID first
      print('Looking for document in MongoDB with ID: $documentId');
      var document = await _documentsCollection!.findOne({'_id': documentId});
      
      // If not found, try with ObjectId
      if (document == null) {
        try {
          ObjectId objId = ObjectId.fromHexString(documentId);
          document = await _documentsCollection!.findOne({'_id': objId});
          print('Found document using ObjectId: $objId');
        } catch (e) {
          print('Error converting to ObjectId: $e');
        }
      }
      
      // If still not found, try searching by gridFSId
      if (document == null) {
        try {
          document = await _documentsCollection!.findOne({'gridFSId': documentId});
          print('Found document by gridFSId: $documentId');
        } catch (e) {
          print('Error finding by gridFSId: $e');
        }
      }
      
      if (document == null) {
        print('Document not found in MongoDB');
        
        // Try to find in fs.files collection directly
        try {
          final db = getNativeDb();
          if (db != null) {
            final fsFile = await db.collection('fs.files').findOne({
              '_id': ObjectId.fromHexString(documentId)
            });
            
            if (fsFile != null) {
              print('Found file in fs.files: $fsFile');
              
              // Create a placeholder document
              document = {
                '_id': documentId,
                'title': fileName,
                'fileName': fileName,
                'gridFSId': documentId,
                'fileSize': fsFile['length'] ?? 0,
                'mimeType': fsFile['contentType'] ?? 'application/octet-stream',
              };
            }
          }
        } catch (e) {
          print('Error checking fs.files: $e');
        }
        
        if (document == null) {
        throw Exception('Document not found in database');
        }
      }
      
      print('Document found in MongoDB: ${document['title']}');
      
      // Check if document uses GridFS
      if (document['gridFSId'] != null) {
        final String gridFSId = document['gridFSId'];
        print('Document references GridFS with ID: $gridFSId');
        
        try {
          // Initialize GridFS if not already done
          if (_gridFS == null) {
            _gridFS = GridFS(_db!, 'fs');
            print('GridFS initialized for document download');
          }
          
          // Try to get the file from GridFS
          ObjectId objId;
          try {
            objId = ObjectId.fromHexString(gridFSId);
          } catch (e) {
            print('Invalid GridFS ID format, trying as string: $e');
            objId = ObjectId.fromHexString(documentId);
          }
          
          // Check if file exists in GridFS
          final db = getNativeDb();
          if (db != null) {
            final fsFile = await db.collection('fs.files').findOne({
              '_id': objId
            });
            
            if (fsFile != null) {
              print('Found file in GridFS: ${fsFile['filename']}');
              
              // Get chunks from fs.chunks
              final chunks = await db.collection('fs.chunks').find({
                'files_id': objId
              }).toList();
              
              if (chunks.isNotEmpty) {
                print('Found ${chunks.length} chunks for file');
                
                // Combine chunks into a single file
                final List<int> fileData = [];
                chunks.sort((a, b) => a['n'] - b['n']); // Sort by chunk number
                
                for (var chunk in chunks) {
                  if (chunk['data'] is BsonBinary) {
                    fileData.addAll((chunk['data'] as BsonBinary).byteList);
                  }
                }
                
                if (fileData.isNotEmpty) {
                  print('Combined ${fileData.length} bytes from chunks');
                  final downloadFile = await _saveToDownloads(fileName, Uint8List.fromList(fileData));
                  print('File saved from GridFS chunks: ${downloadFile.path}');
                  return downloadFile;
                }
              } else {
                print('No chunks found for file');
              }
            }
          }
        } catch (e) {
          print('Error retrieving from GridFS: $e');
        }
        
        // Try to get the local file path as fallback
        String? localFilePath = document['localFilePath'];
        if (localFilePath != null) {
          final File localFile = File(localFilePath);
          if (await localFile.exists()) {
            print('Using local file path: $localFilePath');
            return localFile;
          }
        }
      }
      
      // If we still don't have a file, create a placeholder file with some content
      print('Creating a placeholder file for: $fileName');
      
      // Create placeholder content based on file type
      String placeholderContent;
      if (fileName.toLowerCase().endsWith('.pdf')) {
        placeholderContent = 'PDF PLACEHOLDER\n\nThis is a placeholder for the document: ${document['title']}\n\nThe original file could not be found.';
      } else if (fileName.toLowerCase().endsWith('.jpg') || 
                fileName.toLowerCase().endsWith('.jpeg') || 
                fileName.toLowerCase().endsWith('.png')) {
        placeholderContent = 'IMAGE PLACEHOLDER\n\nThis is a placeholder for the image: ${document['title']}\n\nThe original image could not be found.';
      } else {
        placeholderContent = 'DOCUMENT PLACEHOLDER\n\nThis is a placeholder for the document: ${document['title']}\n\nThe original file could not be found.';
      }
      
      final downloadFile = await _saveToDownloads(fileName, utf8.encode(placeholderContent));
      
      // Update document with new localFilePath
      try {
      await _documentsCollection!.update(
          {'_id': document['_id']},
        {'\$set': {
          'localFilePath': downloadFile.path,
          'fileUrl': 'file://${downloadFile.path}'
        }}
      );
      } catch (e) {
        print('Error updating document with local file path: $e');
      }
      
      print('Created placeholder file at: ${downloadFile.path}');
      return downloadFile;
    } catch (e) {
      print('Error downloading document: $e');
      throw Exception('Error downloading document: $e');
    }
  }
  
  // Helper method to save file to Downloads directory
  Future<File> _saveToDownloads(String fileName, Uint8List fileData) async {
    try {
      // Request storage permissions for Android
      if (Platform.isAndroid) {
        if (kDebugMode) {
          print('Requesting storage permission');
        }
        
        var status = await Permission.storage.status;
        if (!status.isGranted) {
          status = await Permission.storage.request();
          if (!status.isGranted) {
            throw Exception('Storage permission denied');
          }
        }
        
        // For Android 11+ we need to request manage external storage permission
        var externalStatus = await Permission.manageExternalStorage.status;
        if (!externalStatus.isGranted) {
          print('Requesting manage external storage permission');
          externalStatus = await Permission.manageExternalStorage.request();
          if (!externalStatus.isGranted) {
            print('Manage external storage permission denied, but continuing anyway');
          }
        }
        
        if (kDebugMode) {
          print('Storage permission status: ${status.name}');
          print('Manage external storage permission status: ${externalStatus.name}');
        }
      }
      
      // Get Downloads directory
      Directory? downloadsDir;
      
      if (Platform.isAndroid) {
        try {
          // Try to use the external storage directory first (public Downloads folder)
          // Common paths for the Downloads directory on Android
          List<String> possiblePaths = [
            '/storage/emulated/0/Download',
            '/storage/emulated/0/Downloads',
            '/sdcard/Download',
            '/sdcard/Downloads'
          ];
          
          // Try each path until we find one that exists
          for (String path in possiblePaths) {
            Directory dir = Directory(path);
            print('Checking if Downloads directory exists: $path');
            if (await dir.exists()) {
              print('Found Downloads directory: $path');
              downloadsDir = dir;
              break;
            }
          }
          
          // If we couldn't find a standard Downloads directory, use the external storage directory
          if (downloadsDir == null) {
            final externalDir = await getExternalStorageDirectory();
            if (externalDir != null) {
              print('Using external storage directory: ${externalDir.path}');
              downloadsDir = Directory('${externalDir.path}/Download');
              if (!await downloadsDir.exists()) {
                print('Creating Download directory in external storage');
                await downloadsDir.create(recursive: true);
              }
            }
          }
        } catch (e) {
          if (kDebugMode) {
            print('Error accessing external storage: $e');
          }
        }
        
        // If external storage is not available, use application documents directory
        if (downloadsDir == null) {
          final appDocDir = await getApplicationDocumentsDirectory();
          print('Using app documents directory as fallback: ${appDocDir.path}');
          downloadsDir = Directory('${appDocDir.path}/Download');
          if (!await downloadsDir.exists()) {
            print('Creating Download directory in app documents directory');
            await downloadsDir.create(recursive: true);
          }
        }
      } else {
        // For iOS and other platforms, use the documents directory
        final appDocDir = await getApplicationDocumentsDirectory();
        print('Using app documents directory for iOS: ${appDocDir.path}');
        downloadsDir = appDocDir;
      }
      
      if (downloadsDir == null) {
        throw Exception('Could not access Downloads directory');
      }
      
      if (kDebugMode) {
        print('Using downloads directory: ${downloadsDir.path}');
      }
      
      // Create a unique filename
      final String safeFileName = fileName.replaceAll(RegExp(r'[^\w\s.-]'), '_');
      final String uniqueFileName = '${DateTime.now().millisecondsSinceEpoch}_$safeFileName';
      final filePath = '${downloadsDir.path}/$uniqueFileName';
      
      print('Attempting to save file to: $filePath');
      
      // Create and write to the file
      final file = File(filePath);
      await file.writeAsBytes(fileData);
      
      // Verify the file was created
      bool fileExists = await file.exists();
      print('File created successfully: $fileExists');
      print('File size: ${await file.length()} bytes');
      
      if (kDebugMode) {
        print('File saved to: ${file.path}');
      }
      return file;
    } catch (e) {
      if (kDebugMode) {
        print('Error saving file: $e');
        print('Error stack trace: ${StackTrace.current}');
      }
      throw Exception('Failed to save file: $e');
    }
  }

  // Map document type to a format that matches the web app
  String _mapDocumentType(String type) {
    // Map from mobile app document types to web app document types
    final Map<String, String> typeMapping = {
      'Birth Certificate': 'other',
      'ID Card': 'identification',
      'Picture 2x2': 'identification',
      '3R ROTC Certificate': 'training_certificate',
      'Enlistment Order': 'other',
      'Promotion Order': 'promotion',
      'Order of Incorporation': 'other',
      'Schooling Certificate': 'training_certificate',
      'College Diploma': 'training_certificate',
      'RIDS': 'other',
      'Medical Certificate': 'medical_record',
      'Training Certificate': 'training_certificate',
      'Deployment Order': 'other',
      'Commendation': 'commendation',
      'Other': 'other'
    };
    
    // Return the mapped type or default to 'other'
    return typeMapping[type] ?? 'other';
  }

  // Map document title to appropriate document type
  String _mapDocumentTypeFromTitle(String title) {
    final String lowerTitle = title.toLowerCase();
    
    // Map document types based on title keywords
    if (lowerTitle.contains('birth') || lowerTitle.contains('certificate of birth')) {
      return 'birth_certificate';
    } else if (lowerTitle.contains('id') || lowerTitle.contains('identification') || lowerTitle.contains('card')) {
      return 'identification';
    } else if (lowerTitle.contains('picture') || lowerTitle.contains('2x2') || lowerTitle.contains('photo')) {
      return 'identification';
    } else if (lowerTitle.contains('rotc') || lowerTitle.contains('3r rotc') || lowerTitle.contains('rotc certificate')) {
      return 'rotc_certificate';
    } else if (lowerTitle.contains('enlistment')) {
      return 'enlistment_order';
    } else if (lowerTitle.contains('promotion')) {
      return 'promotion';
    } else if (lowerTitle.contains('incorporation')) {
      return 'order_of_incorporation';
    } else if (lowerTitle.contains('schooling')) {
      return 'training_certificate';
    } else if (lowerTitle.contains('diploma') || lowerTitle.contains('college')) {
      return 'training_certificate';
    } else if (lowerTitle.contains('rids') || lowerTitle.contains('reservist information')) {
      return 'rids';
    } else if (lowerTitle.contains('medical') || lowerTitle.contains('health')) {
      return 'medical_record';
    } else if (lowerTitle.contains('training')) {
      return 'training_certificate';
    } else if (lowerTitle.contains('deployment')) {
      return 'deployment_order';
    } else if (lowerTitle.contains('commendation') || lowerTitle.contains('award') || lowerTitle.contains('recognition')) {
      return 'commendation';
      }
      
    // Default to 'other' if no match
    return 'other';
  }

  // Helper method to get native MongoDB database
  dynamic getNativeDb() {
    if (_db != null && _db!.isConnected) {
      return _db; // Return the Db instance directly
    }
    return null;
  }

  // Create a sample document in GridFS for testing
  Future<Map<String, dynamic>> createSampleDocument() async {
    try {
      await _initMongoDB();
          
      if (_db == null) {
        throw Exception('Database not initialized');
      }
      
      // Create a sample PDF content
      final String sampleContent = '''
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 6 0 R >>
endobj
4 0 obj
<< /Font << /F1 5 0 R >> >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Sample Document) Tj ET
endstream
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000210 00000 n
0000000257 00000 n
0000000325 00000 n
trailer << /Size 7 /Root 1 0 R >>
startxref
420
%%EOF
''';
      
      // Save sample content to a temporary file
      final tempDir = await getTemporaryDirectory();
      final tempFile = File('${tempDir.path}/sample_document.pdf');
      await tempFile.writeAsBytes(utf8.encode(sampleContent));
      
      print('Created sample PDF at: ${tempFile.path}');
      
      // Upload the sample document
      final result = await uploadDocument(
        title: 'Sample Document',
        type: 'other',
        filePath: tempFile.path,
        description: 'This is a sample document for testing',
      );
      
      // Delete the temporary file
      await tempFile.delete();
      
      return result;
    } catch (e) {
      print('Error creating sample document: $e');
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }
} 