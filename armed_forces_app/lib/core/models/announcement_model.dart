class Announcement {
  final String id;
  final String title;
  final String content;
  final DateTime date;
  final bool isImportant;
  final String? imageUrl;
  final String? documentUrl;
  final String? createdBy;
  final String? targetType;
  final String? targetId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.date,
    this.isImportant = false,
    this.imageUrl,
    this.documentUrl,
    this.createdBy,
    this.targetType,
    this.targetId,
    this.createdAt,
    this.updatedAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    // Handle ID - can be ObjectId, String, or Map
    String id;
    try {
      if (json['_id'] != null) {
        id = json['_id'].toString();
      } else if (json['id'] != null) {
        id = json['id'].toString();
      } else {
        id = 'unknown_id';
      }
    } catch (e) {
      id = 'parse_error_id';
    }
    
    // Handle required String fields with safe fallbacks
    String title;
    try {
      title = json['title'] as String? ?? 'Untitled Announcement';
    } catch (e) {
      title = 'Error Loading Title';
    }
    
    String content;
    try {
      content = json['content'] as String? ?? 'No content available';
    } catch (e) {
      content = 'Error loading content';
    }
    
    // Handle date with fallback
    DateTime date;
    try {
      if (json['date'] is DateTime) {
        date = json['date'] as DateTime;
      } else if (json['date'] != null) {
        date = DateTime.parse(json['date'].toString());
      } else {
        date = DateTime.now();
      }
    } catch (e) {
      date = DateTime.now();
    }
    
    // Handle boolean with safe default
    bool isImportant;
    try {
      isImportant = json['isImportant'] as bool? ?? false;
    } catch (e) {
      isImportant = false;
    }

    // Handle createdBy, could be ObjectId or String
    String? createdBy;
    try {
      if (json['createdBy'] != null) {
        createdBy = json['createdBy'].toString();
      }
    } catch (e) {
      createdBy = null;
    }

    // Handle optional string fields
    String? imageUrl;
    try {
      imageUrl = json['imageUrl'] as String?;
    } catch (e) {
      imageUrl = null;
    }
    
    String? documentUrl;
    try {
      documentUrl = json['documentUrl'] as String?;
    } catch (e) {
      documentUrl = null;
    }
    
    String? targetType;
    try {
      targetType = json['targetType'] as String?;
    } catch (e) {
      targetType = null;
    }
    
    String? targetId;
    try {
      targetId = json['targetId'] as String?;
    } catch (e) {
      targetId = null;
    }
    
    // Handle date fields with safe parsing
    DateTime? createdAt;
    try {
      if (json['createdAt'] is DateTime) {
        createdAt = json['createdAt'] as DateTime;
      } else if (json['createdAt'] != null) {
        createdAt = DateTime.parse(json['createdAt'].toString());
      }
    } catch (e) {
      createdAt = null;
    }
    
    DateTime? updatedAt;
    try {
      if (json['updatedAt'] is DateTime) {
        updatedAt = json['updatedAt'] as DateTime;
      } else if (json['updatedAt'] != null) {
        updatedAt = DateTime.parse(json['updatedAt'].toString());
      }
    } catch (e) {
      updatedAt = null;
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
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'date': date.toIso8601String(),
      'isImportant': isImportant,
      'imageUrl': imageUrl,
      'documentUrl': documentUrl,
      'createdBy': createdBy,
      'targetType': targetType,
      'targetId': targetId,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
} 