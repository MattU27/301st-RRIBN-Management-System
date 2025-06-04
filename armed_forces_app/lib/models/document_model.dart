class Document {
  final String id;
  final String userId;
  final String title;
  final String type; // ID Card, Medical Certificate, Training Certificate, etc.
  final String? description;
  final String fileUrl;
  final String fileName;
  final int fileSize; // in bytes
  final String? mimeType;
  final String status; // 'pending', 'verified', 'rejected'
  final DateTime? expirationDate;
  final String? verifiedBy; // Staff/Admin ID who verified the document
  final DateTime? verifiedAt;
  final String? rejectionReason;
  final DateTime uploadedAt;
  final DateTime updatedAt;
  final int version; // Document version tracking
  final List<DocumentVersion>? previousVersions;

  Document({
    required this.id,
    required this.userId,
    required this.title,
    required this.type,
    this.description,
    required this.fileUrl,
    required this.fileName,
    required this.fileSize,
    this.mimeType,
    required this.status,
    this.expirationDate,
    this.verifiedBy,
    this.verifiedAt,
    this.rejectionReason,
    required this.uploadedAt,
    required this.updatedAt,
    required this.version,
    this.previousVersions,
  });

  bool get isPending => status == 'pending';
  bool get isVerified => status == 'verified';
  bool get isRejected => status == 'rejected';
  bool get isExpired => expirationDate != null && expirationDate!.isBefore(DateTime.now());

  factory Document.fromJson(Map<String, dynamic> json) {
    // Handle date parsing more robustly
    DateTime parseDate(dynamic dateValue) {
      if (dateValue == null) {
        return DateTime.now();
      }
      
      try {
        if (dateValue is DateTime) {
          return dateValue;
        } else if (dateValue is String) {
          return DateTime.parse(dateValue);
        } else {
          print('Unknown date format: $dateValue (${dateValue.runtimeType})');
          return DateTime.now();
        }
      } catch (e) {
        print('Error parsing date: $e for value: $dateValue');
        return DateTime.now();
      }
    }
    
    // Handle nullable DateTime fields
    DateTime? parseNullableDate(dynamic dateValue) {
      if (dateValue == null) return null;
      try {
        if (dateValue is DateTime) {
          return dateValue;
        } else if (dateValue is String) {
          return DateTime.parse(dateValue);
        }
      } catch (e) {
        print('Error parsing nullable date: $e for value: $dateValue');
      }
      return null;
    }
    
    // Handle fileSize to ensure it's an integer
    int parseFileSize(dynamic sizeValue) {
      if (sizeValue is int) {
        return sizeValue;
      } else if (sizeValue is double) {
        return sizeValue.toInt();
      } else if (sizeValue is String) {
        return int.tryParse(sizeValue) ?? 0;
      }
      return 0;
    }
    
    // Use _id if id is not available (MongoDB uses _id)
    final String docId = json['id'] ?? json['_id'] ?? DateTime.now().millisecondsSinceEpoch.toString();
    
    // Default to John Matthew Banto's ID if userId is missing or 'current_user'
    final String defaultUserId = '68063c32bb93f9ffb2000000'; // John Matthew Banto's ID
    String userId = json['userId'] ?? '';
    if (userId.isEmpty || userId == 'current_user') {
      userId = defaultUserId;
    }
    
    return Document(
      id: docId,
      userId: userId,
      title: json['title'] ?? 'Untitled Document',
      type: json['type'] ?? 'Other',
      description: json['description'],
      fileUrl: json['fileUrl'] ?? '',
      fileName: json['fileName'] ?? 'document.pdf',
      fileSize: parseFileSize(json['fileSize']),
      mimeType: json['mimeType'],
      status: json['status'] ?? 'pending',
      expirationDate: parseNullableDate(json['expirationDate']),
      verifiedBy: json['verifiedBy'],
      verifiedAt: parseNullableDate(json['verifiedAt']),
      rejectionReason: json['rejectionReason'],
      uploadedAt: parseDate(json['uploadedAt']),
      updatedAt: parseDate(json['updatedAt']),
      version: json['version'] ?? 1,
      previousVersions: json['previousVersions'] != null
          ? (json['previousVersions'] as List)
              .map((v) => DocumentVersion.fromJson(v))
              .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'type': type,
      'description': description,
      'fileUrl': fileUrl,
      'fileName': fileName,
      'fileSize': fileSize,
      'mimeType': mimeType,
      'status': status,
      'expirationDate': expirationDate?.toIso8601String(),
      'verifiedBy': verifiedBy,
      'verifiedAt': verifiedAt?.toIso8601String(),
      'rejectionReason': rejectionReason,
      'uploadedAt': uploadedAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'version': version,
      'previousVersions': previousVersions?.map((v) => v.toJson()).toList(),
    };
  }

  Document copyWith({
    String? id,
    String? userId,
    String? title,
    String? type,
    String? description,
    String? fileUrl,
    String? fileName,
    int? fileSize,
    String? mimeType,
    String? status,
    DateTime? expirationDate,
    String? verifiedBy,
    DateTime? verifiedAt,
    String? rejectionReason,
    DateTime? uploadedAt,
    DateTime? updatedAt,
    int? version,
    List<DocumentVersion>? previousVersions,
  }) {
    return Document(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      type: type ?? this.type,
      description: description ?? this.description,
      fileUrl: fileUrl ?? this.fileUrl,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      mimeType: mimeType ?? this.mimeType,
      status: status ?? this.status,
      expirationDate: expirationDate ?? this.expirationDate,
      verifiedBy: verifiedBy ?? this.verifiedBy,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      rejectionReason: rejectionReason ?? this.rejectionReason,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      updatedAt: updatedAt ?? this.updatedAt,
      version: version ?? this.version,
      previousVersions: previousVersions ?? this.previousVersions,
    );
  }
}

class DocumentVersion {
  final String versionId;
  final int versionNumber;
  final String fileUrl;
  final String fileName;
  final int fileSize;
  final String? notes;
  final DateTime createdAt;
  final String createdBy;

  DocumentVersion({
    required this.versionId,
    required this.versionNumber,
    required this.fileUrl,
    required this.fileName,
    required this.fileSize,
    this.notes,
    required this.createdAt,
    required this.createdBy,
  });

  factory DocumentVersion.fromJson(Map<String, dynamic> json) {
    return DocumentVersion(
      versionId: json['versionId'],
      versionNumber: json['versionNumber'],
      fileUrl: json['fileUrl'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['createdAt']),
      createdBy: json['createdBy'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'versionId': versionId,
      'versionNumber': versionNumber,
      'fileUrl': fileUrl,
      'fileName': fileName,
      'fileSize': fileSize,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'createdBy': createdBy,
    };
  }
} 