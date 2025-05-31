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
  final String securityClassification; // 'Unclassified', 'Confidential', 'Secret', 'Top Secret'
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
    required this.securityClassification,
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
  bool get isConfidential => securityClassification != 'Unclassified';
  bool get isTopSecret => securityClassification == 'Top Secret';

  factory Document.fromJson(Map<String, dynamic> json) {
    return Document(
      id: json['id'],
      userId: json['userId'],
      title: json['title'],
      type: json['type'],
      description: json['description'],
      fileUrl: json['fileUrl'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
      mimeType: json['mimeType'],
      status: json['status'],
      securityClassification: json['securityClassification'],
      expirationDate: json['expirationDate'] != null ? DateTime.parse(json['expirationDate']) : null,
      verifiedBy: json['verifiedBy'],
      verifiedAt: json['verifiedAt'] != null ? DateTime.parse(json['verifiedAt']) : null,
      rejectionReason: json['rejectionReason'],
      uploadedAt: DateTime.parse(json['uploadedAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
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
      'securityClassification': securityClassification,
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
    String? securityClassification,
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
      securityClassification: securityClassification ?? this.securityClassification,
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