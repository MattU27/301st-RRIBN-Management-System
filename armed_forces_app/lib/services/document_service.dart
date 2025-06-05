import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mongo_dart/mongo_dart.dart';
import '../core/constants/app_constants.dart';
import '../models/document_model.dart';
import '../models/user_model.dart';
import './socket_service.dart';

class DocumentService {
  // MongoDB connection
  Db? _db;
  DbCollection? _documentsCollection;
  DbCollection? _usersCollection;
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
      print('Connected to MongoDB successfully');
    } catch (e) {
      print('Error connecting to MongoDB: $e');
      throw Exception('Failed to connect to MongoDB: $e');
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
      
      final List<Map<String, dynamic>> documents = await _documentsCollection!.find().toList();
      print('Found ${documents.length} documents in MongoDB');
      
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
          processedDoc['userId'] = processedDoc['userId'] ?? 'current_user';
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
              // Use default information for John Matthew Banto
              processedDoc['uploadedBy'] = {
                '_id': userId,
                'firstName': 'John Matthew',
                'lastName': 'Banto',
                'serviceId': '2023-92596',
                'company': 'Bravo',
                'rank': 'Private'
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
  
  // Upload a document directly to MongoDB
  Future<Document> uploadDocument({
    required String title,
    required String type,
    required File file,
    String? description,
  }) async {
    try {
      // Add debug print to trace execution path
      print('Starting document upload process for: $title');
      
      // Initialize user information variables that will be used throughout the method
      String effectiveUserId = '';
      String? firstName;
      String? lastName;
      String? serviceNumber;
      String? company;
      String? rank;
      
      // Try API first
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConstants.authTokenKey) ?? prefs.getString(AppConstants.tokenKey);
        final userId = prefs.getString(AppConstants.userIdKey);
        
        print('Uploading document with token: ${token != null ? 'Available' : 'Not available'}');
        print('User ID from prefs: $userId');
        
        // If no userId is found in prefs, try to get it from the API
        if (userId != null && userId.isNotEmpty) {
          effectiveUserId = userId;
        }
        
        if (effectiveUserId.isEmpty) {
          // Try to get user info from API to get a valid ID
          try {
            final userResponse = await http.get(
              Uri.parse(AppConstants.userProfileEndpoint),
              headers: {
                'Authorization': 'Bearer $token',
              },
            );
            
            if (userResponse.statusCode == 200) {
              final userData = json.decode(userResponse.body);
              if (userData['success'] && userData['data'] != null && userData['data']['user'] != null) {
                final user = userData['data']['user'];
                final apiUserId = user['_id'] ?? user['id'] ?? '';
                
                if (apiUserId.isNotEmpty) {
                  effectiveUserId = apiUserId;
                  // Save this ID for future use
                  await prefs.setString(AppConstants.userIdKey, effectiveUserId);
                }
                
                // Extract user information if available
                firstName = user['firstName'];
                lastName = user['lastName'];
                serviceNumber = user['serviceNumber'] ?? user['serialNumber'];
                company = user['company'] ?? user['unit'];
                rank = user['rank'];
              }
            }
          } catch (e) {
            print('Error fetching user profile: $e');
          }
        }
        
        // If we still don't have user information, try to get it from storage
        if (firstName == null || lastName == null) {
          final userData = await _getCurrentUserData();
          if (userData != null) {
            firstName = userData['firstName'];
            lastName = userData['lastName'];
            serviceNumber = userData['serialNumber'] ?? userData['serviceNumber'];
            company = userData['company'] ?? userData['unit'];
            rank = userData['rank'];
            
            // If we got user data but still don't have an ID, use it from userData
            if (effectiveUserId.isEmpty && userData['id'] != null) {
              effectiveUserId = userData['id'];
            }
          }
        }
        
        if (token != null) {
          // Create multipart request
          final request = http.MultipartRequest(
            'POST',
            Uri.parse(AppConstants.uploadDocumentEndpoint),
          );
          
          // Add headers
          request.headers.addAll({
            'Authorization': 'Bearer $token',
          });
          
          // Add file
          final fileStream = http.ByteStream(file.openRead());
          final fileLength = await file.length();
          final fileName = file.path.split('/').last;
          
          final multipartFile = http.MultipartFile(
            'file',
            fileStream,
            fileLength,
            filename: fileName,
          );
          
          request.files.add(multipartFile);
          
          // Add form fields
          request.fields['name'] = title;
          request.fields['type'] = type;
          // Use the current user's ID
          request.fields['userId'] = effectiveUserId;
          
          if (description != null && description.isNotEmpty) {
            request.fields['description'] = description;
          }
          
          // Add user information fields to ensure proper uploader info
          if (firstName != null && firstName.isNotEmpty) {
            request.fields['firstName'] = firstName;
          }
          if (lastName != null && lastName.isNotEmpty) {
            request.fields['lastName'] = lastName;
          }
          if (serviceNumber != null && serviceNumber.isNotEmpty) {
            request.fields['serviceNumber'] = serviceNumber;
          }
          if (company != null && company.isNotEmpty) {
            request.fields['company'] = company;
          }
          if (rank != null && rank.isNotEmpty) {
            request.fields['rank'] = rank;
          }
          
          // Send request
          final streamedResponse = await request.send();
          final response = await http.Response.fromStream(streamedResponse);
          
          print('Document upload response status: ${response.statusCode}');
          print('Document upload response body: ${response.body.substring(0, math.min(200, response.body.length))}...');
          
          if (response.statusCode == 200 || response.statusCode == 201) {
            final Map<String, dynamic> data = json.decode(response.body);
            
            if (data['success'] == true && data['data'] != null && data['data']['document'] != null) {
              final document = Document.fromJson(data['data']['document']);
              
              // Notify web app via socket
              try {
                final socketService = SocketService();
                await socketService.initSocket();
                socketService.notifyDocumentUploaded(data['data']['document']);
              } catch (socketError) {
                print('Socket notification error: $socketError');
                // Continue even if socket notification fails
              }
              
              return document;
            }
          }
        }
      } catch (e) {
        print('API error: $e');
      }
      
      // Fallback to direct MongoDB
      print('Uploading document directly to MongoDB');
      await _initMongoDB();
      
      if (_documentsCollection == null) {
        throw Exception('Documents collection not initialized');
      }
      
      // Get file name and create a unique name to avoid conflicts
      final String originalFileName = file.path.split('/').last;
      final String uniqueFileName = '${DateTime.now().millisecondsSinceEpoch}_$originalFileName';
      
      // Save file locally to a more permanent location
      Directory? appDir;
      try {
        // Try to use application documents directory
        appDir = Directory.systemTemp;
        // Create a documents subdirectory if it doesn't exist
        final Directory docsDir = Directory('${appDir.path}/documents');
        if (!await docsDir.exists()) {
          await docsDir.create(recursive: true);
        }
        appDir = docsDir;
      } catch (e) {
        print('Error creating documents directory: $e');
        // Fallback to system temp
        appDir = Directory.systemTemp;
      }
      
      final String savedFilePath = '${appDir.path}/$uniqueFileName';
      print('Saving file to: $savedFilePath');
      
      // Copy the file to our storage location
      final File savedFile = await file.copy(savedFilePath);
      print('File saved locally to: $savedFilePath');
      
      // Verify the file was saved
      if (!await savedFile.exists()) {
        print('Warning: File was not saved properly');
        throw Exception('Failed to save file locally');
      }
      
      // Get file size
      final fileSize = await savedFile.length();
      print('File size: $fileSize bytes');
      
      // Get current user data
      Map<String, dynamic>? userData = await _getCurrentUserData();
      print('User data from storage: ${userData != null ? 'Found' : 'Not found'}');
      
      // Try to get service number and find user by service number
      // Note: We're reusing the variables declared at the top of the method
      
      if (userData != null) {
        // Extract user information from userData
        if (effectiveUserId.isEmpty && userData['id'] != null) {
          effectiveUserId = userData['id'];
        }
        firstName = userData['firstName'];
        lastName = userData['lastName'];
        serviceNumber = userData['serialNumber'] ?? userData['serviceNumber'];
        company = userData['company'] ?? userData['unit'];
        rank = userData['rank'];
        
        print('User info from storage:');
        print('  ID: $effectiveUserId');
        print('  Name: $firstName $lastName');
        print('  Service Number: $serviceNumber');
        print('  Company: $company');
        print('  Rank: $rank');
      }
      
      // If we don't have user data from storage, try to find by service number
      if (effectiveUserId.isEmpty && serviceNumber != null && serviceNumber.isNotEmpty) {
        final userFromDb = await _findUserByServiceNumber(serviceNumber);
        if (userFromDb != null) {
          effectiveUserId = userFromDb['_id'] is ObjectId ? 
                         userFromDb['_id'].toHexString() : 
                         userFromDb['_id'].toString();
          firstName = userFromDb['firstName'];
          lastName = userFromDb['lastName'];
          company = userFromDb['company'];
          rank = userFromDb['rank'];
          
          print('User info from database:');
          print('  ID: $effectiveUserId');
          print('  Name: $firstName $lastName');
          print('  Service Number: $serviceNumber');
          print('  Company: $company');
          print('  Rank: $rank');
        }
      }
      
      // Only use John Matthew Banto's information if we have no user info at all
      // This should rarely happen if the user is properly logged in
      if (effectiveUserId.isEmpty || firstName == null || lastName == null) {
        print('WARNING: No valid user information found. Using emergency fallback.');
        
        // Try to get user ID from secure storage directly
        final userId = await _secureStorage.read(key: AppConstants.userIdKey);
        if (userId != null && userId.isNotEmpty) {
          print('Found user ID in secure storage: $userId');
          final userFromDb = await _findUserById(userId);
          
          if (userFromDb != null) {
            effectiveUserId = userId;
            firstName = userFromDb['firstName'];
            lastName = userFromDb['lastName'];
            serviceNumber = userFromDb['serviceNumber'];
            company = userFromDb['company'];
            rank = userFromDb['rank'];
            
            print('Found user info from ID in database:');
            print('  Name: $firstName $lastName');
            print('  Service Number: $serviceNumber');
            print('  Company: $company');
            print('  Rank: $rank');
          }
        }
        
        // If we still don't have user info, only then use John Matthew Banto as last resort
        if (effectiveUserId.isEmpty || firstName == null || lastName == null) {
          print('CRITICAL: Using John Matthew Banto as fallback. This should not happen in normal operation.');
          effectiveUserId = '68063c32bb93f9ffb2000000'; // John Matthew Banto's correct ID
          firstName = 'John Matthew';
          lastName = 'Banto';
          serviceNumber = '2019-10180';
          company = 'Alpha';
          rank = 'Private';
        }
      }
      
      // Create document object
      final String documentId = ObjectId().toHexString();
      final now = DateTime.now();
      
      // Create document data with proper field names for MongoDB
      final Map<String, dynamic> documentData = {
        '_id': documentId,
        'userId': effectiveUserId,
        'uploadedBy': {
          '_id': effectiveUserId,
          'firstName': firstName,
          'lastName': lastName,
          'serviceId': serviceNumber,
          'company': company,
          'rank': rank
        },
        'title': title,
        'type': _mapDocumentType(type),
        'description': description,
        'fileUrl': 'file://$savedFilePath',
        'fileName': originalFileName,
        'fileSize': fileSize,
        'mimeType': _getMimeType(file.path),
        'status': 'pending',
        'uploadedAt': now,
        'updatedAt': now,
        'version': 1,
        'localFilePath': savedFilePath,
      };
      
      print('Inserting document into MongoDB: $title');
      
      // Insert into MongoDB
      await _documentsCollection!.insert(documentData);
      print('Document saved to MongoDB with ID: $documentId');
      
      // Verify the document was saved
      final savedDoc = await _documentsCollection!.findOne({'_id': documentId});
      if (savedDoc == null) {
        print('Warning: Document not found in MongoDB after saving');
      } else {
        print('Document verified in MongoDB: ${savedDoc['title']}');
        print('Saved document local file path: ${savedDoc['localFilePath']}');
        
        // Verify the file path is correct in the database
        if (savedDoc['localFilePath'] != savedFilePath) {
          print('Warning: File path mismatch in database. Updating...');
          await _documentsCollection!.update(
            {'_id': documentId},
            {'\$set': {'localFilePath': savedFilePath}}
          );
        }
      }
      
      // Return document object
      return Document(
        id: documentId,
        userId: effectiveUserId!,
        title: title,
        type: _mapDocumentType(type),
        description: description,
        fileUrl: 'file://$savedFilePath',
        fileName: originalFileName,
        fileSize: fileSize,
        mimeType: _getMimeType(file.path),
        status: 'pending',
        uploadedAt: now,
        updatedAt: now,
        version: 1,
        uploadedBy: {
          '_id': effectiveUserId,
          'firstName': firstName ?? 'Unknown',
          'lastName': lastName ?? 'Unknown',
          'serviceId': serviceNumber ?? '',
          'company': company ?? '',
          'rank': rank ?? ''
        },
      );
    } catch (e) {
      print('Error uploading document: $e');
      throw Exception('Error uploading document: $e');
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
      
      // Find document to get file path
      final document = await _documentsCollection!.findOne({'_id': documentId});
      
      // Delete from MongoDB
      await _documentsCollection!.remove({'_id': documentId});
      
      // Delete local file if it exists
      if (document != null && document['localFilePath'] != null) {
        final File localFile = File(document['localFilePath']);
        if (await localFile.exists()) {
          await localFile.delete();
        }
      }
      
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
      
      // Find document
      print('Looking for document in MongoDB with ID: $documentId');
      final document = await _documentsCollection!.findOne({'_id': documentId});
      
      if (document == null) {
        print('Document not found in MongoDB');
        throw Exception('Document not found in database');
      }
      
      print('Document found in MongoDB: ${document['title']}');
      
      // Try to get the local file path
      String? localFilePath = document['localFilePath'];
      File? sourceFile;
      
      // If we have a local file path, check if the file exists
      if (localFilePath != null) {
        print('Local file path found: $localFilePath');
        sourceFile = File(localFilePath);
        if (await sourceFile.exists()) {
          print('Local file exists, returning it directly');
          return sourceFile;
        } else {
          print('Local file does not exist at path: $localFilePath');
          sourceFile = null;
        }
      } else {
        print('No local file path found in document data');
      }
      
      // If we have a fileUrl that starts with file:// but the file doesn't exist
      // or we don't have a localFilePath, try to extract the path from fileUrl
      if (sourceFile == null) {
        final String? fileUrl = document['fileUrl'];
        if (fileUrl != null && fileUrl.startsWith('file://')) {
          final String extractedPath = fileUrl.substring(7); // Remove 'file://'
          sourceFile = File(extractedPath);
          if (await sourceFile.exists()) {
            print('File found from fileUrl: $extractedPath');
            
            // Update document with correct localFilePath
            await _documentsCollection!.update(
              {'_id': documentId},
              {'\$set': {'localFilePath': extractedPath}}
            );
            
            return sourceFile;
          } else {
            print('File from fileUrl does not exist: $extractedPath');
            sourceFile = null;
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
      await _documentsCollection!.update(
        {'_id': documentId},
        {'\$set': {
          'localFilePath': downloadFile.path,
          'fileUrl': 'file://${downloadFile.path}'
        }}
      );
      
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
      // For simplicity and to avoid permission issues, let's use the app's internal storage
      Directory? directory;
      
      try {
        // Use the app's documents directory which doesn't require special permissions
        directory = Directory.systemTemp;
        
        // Create a documents subdirectory if it doesn't exist
        final Directory docsDir = Directory('${directory.path}/documents');
        if (!await docsDir.exists()) {
          await docsDir.create(recursive: true);
        }
        directory = docsDir;
        
        print('Using internal storage directory: ${directory.path}');
      } catch (e) {
        print('Error getting app directory: $e');
        directory = Directory.systemTemp;
      }
      
      // Ensure unique filename to avoid overwriting existing files
      final String uniqueFileName = '${DateTime.now().millisecondsSinceEpoch}_$fileName';
      final String filePath = '${directory.path}/$uniqueFileName';
      
      // Create and write to the file
      final File file = File(filePath);
      await file.writeAsBytes(fileData);
      
      print('File saved to: $filePath');
      return file;
    } catch (e) {
      print('Error saving file: $e');
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

  // Create a new document in MongoDB
  Future<Document> _createDocumentInMongoDB({
    required String title,
    required String type,
    required String fileUrl,
    required String fileName,
    required int fileSize,
    String? description,
    String? userId,
  }) async {
    try {
      await _initMongoDB();
      
      if (_documentsCollection == null) {
        throw Exception('Documents collection not initialized');
      }
      
      // Get current user data
      Map<String, dynamic>? userData = await _getCurrentUserData();
      print('User data from storage: ${userData != null ? 'Found' : 'Not found'}');
      
      // Initialize user information variables
      String effectiveUserId = '';
      String? firstName;
      String? lastName;
      String? serviceNumber;
      String? company;
      String? rank;
      
      // If userId is provided, use it
      if (userId != null && userId.isNotEmpty) {
        effectiveUserId = userId;
      }
      
      // Try to get user info from userData
      if (userData != null) {
        // Extract user information from userData
        if (effectiveUserId.isEmpty && userData['id'] != null) {
          effectiveUserId = userData['id'];
        }
        firstName = userData['firstName'];
        lastName = userData['lastName'];
        serviceNumber = userData['serialNumber'] ?? userData['serviceNumber'];
        company = userData['company'] ?? userData['unit'];
        rank = userData['rank'];
        
        print('User info from storage:');
        print('  ID: $effectiveUserId');
        print('  Name: $firstName $lastName');
        print('  Service Number: $serviceNumber');
        print('  Company: $company');
        print('  Rank: $rank');
      }
      
      // If we don't have user data from storage, try to find by service number
      if (effectiveUserId.isEmpty && serviceNumber != null && serviceNumber.isNotEmpty) {
        final userFromDb = await _findUserByServiceNumber(serviceNumber);
        if (userFromDb != null) {
          effectiveUserId = userFromDb['_id'] is ObjectId ? 
                         userFromDb['_id'].toHexString() : 
                         userFromDb['_id'].toString();
          firstName = userFromDb['firstName'];
          lastName = userFromDb['lastName'];
          company = userFromDb['company'];
          rank = userFromDb['rank'];
          
          print('User info from database:');
          print('  ID: $effectiveUserId');
          print('  Name: $firstName $lastName');
          print('  Service Number: $serviceNumber');
          print('  Company: $company');
          print('  Rank: $rank');
        }
      }
      
      // Only use John Matthew Banto's information if we have no user info at all
      // This should rarely happen if the user is properly logged in
      if (effectiveUserId.isEmpty || firstName == null || lastName == null) {
        print('WARNING: No valid user information found. Using emergency fallback.');
        
        // Try to get user ID from secure storage directly
        final userId = await _secureStorage.read(key: AppConstants.userIdKey);
        if (userId != null && userId.isNotEmpty) {
          print('Found user ID in secure storage: $userId');
          final userFromDb = await _findUserById(userId);
          
          if (userFromDb != null) {
            effectiveUserId = userId;
            firstName = userFromDb['firstName'];
            lastName = userFromDb['lastName'];
            serviceNumber = userFromDb['serviceNumber'];
            company = userFromDb['company'];
            rank = userFromDb['rank'];
            
            print('Found user info from ID in database:');
            print('  Name: $firstName $lastName');
            print('  Service Number: $serviceNumber');
            print('  Company: $company');
            print('  Rank: $rank');
          }
        }
        
        // If we still don't have user info, only then use John Matthew Banto as last resort
        if (effectiveUserId.isEmpty || firstName == null || lastName == null) {
          print('CRITICAL: Using John Matthew Banto as fallback. This should not happen in normal operation.');
          effectiveUserId = '68063c32bb93f9ffb2000000'; // John Matthew Banto's correct ID
          firstName = 'John Matthew';
          lastName = 'Banto';
          serviceNumber = '2019-10180';
          company = 'Alpha';
          rank = 'Private';
        }
      }
      
      // Generate a unique ID for the document
      final ObjectId documentId = ObjectId();
      final now = DateTime.now();
      
      // Create the document object
      final Map<String, dynamic> documentData = {
        '_id': documentId,
        'title': title,
        'type': type,
        'description': description,
        'fileUrl': fileUrl,
        'fileName': fileName,
        'fileSize': fileSize,
        'mimeType': _getMimeType(fileName),
        'userId': effectiveUserId,
        'uploadedBy': {
          '_id': effectiveUserId,
          'firstName': firstName,
          'lastName': lastName,
          'serviceId': serviceNumber,
          'company': company,
          'rank': rank
        },
        'status': 'pending',
        'version': 1,
        'createdAt': now,
        'updatedAt': now,
        'uploadedAt': now,
      };
      
      // Insert the document into MongoDB
      await _documentsCollection!.insert(documentData);
      
      print('Document created in MongoDB: ${documentId.toHexString()}');
      
      // Convert the document data to a Document object
      return Document.fromJson({
        'id': documentId.toHexString(),
        'userId': effectiveUserId,
        'title': title,
        'type': type,
        'description': description,
        'fileUrl': fileUrl,
        'fileName': fileName,
        'fileSize': fileSize,
        'mimeType': _getMimeType(fileName),
        'status': 'pending',
        'uploadedAt': now,
        'updatedAt': now,
        'version': 1,
      });
    } catch (e) {
      print('Error creating document in MongoDB: $e');
      throw Exception('Failed to create document: $e');
    }
  }
} 