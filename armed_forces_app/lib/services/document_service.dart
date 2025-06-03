import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mongo_dart/mongo_dart.dart';
import '../core/constants/app_constants.dart';
import '../models/document_model.dart';

class DocumentService {
  // MongoDB connection
  Db? _db;
  DbCollection? _documentsCollection;
  
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
      print('Connected to MongoDB successfully');
    } catch (e) {
      print('Error connecting to MongoDB: $e');
      throw Exception('Failed to connect to MongoDB: $e');
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
          processedDoc['securityClassification'] = processedDoc['securityClassification'] ?? 'Unclassified';
          
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
  
  // Upload a document directly to MongoDB
  Future<Document> uploadDocument({
    required String title,
    required String type,
    required File file,
    String? description,
  }) async {
    try {
      // Try API first
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConstants.authTokenKey);
        
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
          request.fields['title'] = title;
          request.fields['type'] = type;
          request.fields['securityClassification'] = 'Unclassified'; // Default value
          
          if (description != null && description.isNotEmpty) {
            request.fields['description'] = description;
          }
          
          // Send request
          final streamedResponse = await request.send();
          final response = await http.Response.fromStream(streamedResponse);
          
          if (response.statusCode == 200 || response.statusCode == 201) {
            final Map<String, dynamic> data = json.decode(response.body);
            
            if (data['success'] == true && data['data'] != null && data['data']['document'] != null) {
              return Document.fromJson(data['data']['document']);
            }
          }
        }
      } catch (e) {
        print('API upload error: $e. Using direct MongoDB upload.');
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
      
      // Create document object
      final String documentId = ObjectId().toHexString();
      final now = DateTime.now();
      
      // Create document data with proper field names for MongoDB
      final Map<String, dynamic> documentData = {
        '_id': documentId,
        'userId': 'current_user',
        'title': title,
        'type': type,
        'description': description,
        'fileUrl': 'file://$savedFilePath',
        'fileName': originalFileName,
        'fileSize': fileSize,
        'mimeType': _getMimeType(file.path),
        'status': 'pending',
        'securityClassification': 'Unclassified',
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
        userId: 'current_user',
        title: title,
        type: type,
        description: description,
        fileUrl: 'file://$savedFilePath',
        fileName: originalFileName,
        fileSize: fileSize,
        mimeType: _getMimeType(file.path),
        status: 'pending',
        securityClassification: 'Unclassified',
        uploadedAt: now,
        updatedAt: now,
        version: 1,
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
            // Create a temporary file
            final Directory tempDir = Directory.systemTemp;
            final File file = File('${tempDir.path}/$fileName');
            
            // Write the file
            await file.writeAsBytes(response.bodyBytes);
            print('File downloaded from API to: ${file.path}');
            return file;
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
      
      // If we have a local file path, check if the file exists
      if (localFilePath != null) {
        print('Local file path found: $localFilePath');
        final File localFile = File(localFilePath);
        if (await localFile.exists()) {
          print('Local file exists, returning it');
          return localFile;
        } else {
          print('Local file does not exist at path: $localFilePath');
        }
      } else {
        print('No local file path found in document data');
      }
      
      // If we have a fileUrl that starts with file:// but the file doesn't exist
      // or we don't have a localFilePath, try to extract the path from fileUrl
      final String? fileUrl = document['fileUrl'];
      if (fileUrl != null && fileUrl.startsWith('file://')) {
        final String extractedPath = fileUrl.substring(7); // Remove 'file://'
        final File extractedFile = File(extractedPath);
        if (await extractedFile.exists()) {
          print('File found from fileUrl: $extractedPath');
          
          // Update document with correct localFilePath
          await _documentsCollection!.update(
            {'_id': documentId},
            {'\$set': {'localFilePath': extractedPath}}
          );
          
          return extractedFile;
        } else {
          print('File from fileUrl does not exist: $extractedPath');
        }
      }
      
      // If we still don't have a file, create a placeholder file with some content
      print('Creating a placeholder file for: $fileName');
      final Directory tempDir = Directory.systemTemp;
      final String placeholderPath = '${tempDir.path}/${DateTime.now().millisecondsSinceEpoch}_$fileName';
      final File placeholderFile = File(placeholderPath);
      
      // Create a simple text file as placeholder
      if (fileName.toLowerCase().endsWith('.pdf')) {
        // For PDFs, we could use a package to create a simple PDF
        await placeholderFile.writeAsString('This is a placeholder for the document: ${document['title']}');
      } else if (fileName.toLowerCase().endsWith('.jpg') || 
                fileName.toLowerCase().endsWith('.jpeg') || 
                fileName.toLowerCase().endsWith('.png')) {
        // For images, create a text file explaining it's a placeholder
        await placeholderFile.writeAsString('This is a placeholder for the image: ${document['title']}');
      } else {
        // For other files, create a text file
        await placeholderFile.writeAsString('This is a placeholder for the document: ${document['title']}');
      }
      
      // Update document with new localFilePath
      await _documentsCollection!.update(
        {'_id': documentId},
        {'\$set': {
          'localFilePath': placeholderPath,
          'fileUrl': 'file://$placeholderPath'
        }}
      );
      
      print('Created placeholder file at: $placeholderPath');
      return placeholderFile;
    } catch (e) {
      print('Error downloading document: $e');
      throw Exception('Error downloading document: $e');
    }
  }
} 