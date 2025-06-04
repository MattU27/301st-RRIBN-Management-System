import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  
  IO.Socket? _socket;
  bool _isConnected = false;
  
  bool get isConnected => _isConnected;
  IO.Socket? get socket => _socket;
  
  SocketService._internal();
  
  // Initialize socket connection
  Future<void> initSocket() async {
    if (_socket != null) {
      print('Socket already initialized');
      return;
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.authTokenKey) ?? 
                    prefs.getString(AppConstants.tokenKey);
      
      if (token == null) {
        print('No token available for socket connection');
        return;
      }
      
      // Connect to socket server
      _socket = IO.io(
        AppConstants.baseUrl,
        IO.OptionBuilder()
          .setTransports(['websocket'])
          .setPath('/api/socket')
          .setQuery({'token': token})
          .enableAutoConnect()
          .build()
      );
      
      // Set up event handlers
      _socket!.onConnect((_) {
        print('Socket connected: ${_socket!.id}');
        _isConnected = true;
      });
      
      _socket!.onDisconnect((_) {
        print('Socket disconnected');
        _isConnected = false;
      });
      
      _socket!.onConnectError((error) {
        print('Socket connection error: $error');
        _isConnected = false;
      });
      
      _socket!.onError((error) {
        print('Socket error: $error');
      });
      
      print('Socket initialized');
    } catch (e) {
      print('Error initializing socket: $e');
    }
  }
  
  // Disconnect socket
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    print('Socket disconnected');
  }
  
  // Send document uploaded event
  void notifyDocumentUploaded(Map<String, dynamic> document) {
    if (_socket != null && _isConnected) {
      print('Emitting document:new event');
      _socket!.emit('document:new', document);
    } else {
      print('Socket not connected, cannot emit document:new event');
    }
  }
  
  // Send document updated event
  void notifyDocumentUpdated(Map<String, dynamic> document) {
    if (_socket != null && _isConnected) {
      print('Emitting document:update event');
      _socket!.emit('document:update', document);
    } else {
      print('Socket not connected, cannot emit document:update event');
    }
  }
  
  // Send document deleted event
  void notifyDocumentDeleted(String documentId) {
    if (_socket != null && _isConnected) {
      print('Emitting document:delete event');
      _socket!.emit('document:delete', documentId);
    } else {
      print('Socket not connected, cannot emit document:delete event');
    }
  }
} 