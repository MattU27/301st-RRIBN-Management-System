class Policy {
  final String id;
  final String title;
  final String description;
  final String content;
  final String category;
  final String version;
  final String status;
  final DateTime effectiveDate;
  final DateTime? expirationDate;
  final DateTime lastUpdated;
  final DateTime createdAt;
  final String? documentUrl;
  final Map<String, dynamic>? createdBy;

  Policy({
    required this.id,
    required this.title,
    required this.description,
    required this.content,
    required this.category,
    required this.version,
    required this.status,
    required this.effectiveDate,
    this.expirationDate,
    required this.lastUpdated,
    required this.createdAt,
    this.documentUrl,
    this.createdBy,
  });

  factory Policy.fromJson(Map<String, dynamic> json) {
    return Policy(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      content: json['content'] ?? '',
      category: json['category'] ?? '',
      version: json['version'] ?? '',
      status: json['status'] ?? 'draft',
      effectiveDate: json['effectiveDate'] != null 
          ? DateTime.parse(json['effectiveDate']) 
          : DateTime.now(),
      expirationDate: json['expirationDate'] != null 
          ? DateTime.parse(json['expirationDate']) 
          : null,
      lastUpdated: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : DateTime.now(),
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      documentUrl: json['documentUrl'],
      createdBy: json['createdBy'] is Map 
          ? json['createdBy'] as Map<String, dynamic> 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'content': content,
      'category': category,
      'version': version,
      'status': status,
      'effectiveDate': effectiveDate.toIso8601String(),
      'expirationDate': expirationDate?.toIso8601String(),
      'updatedAt': lastUpdated.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'documentUrl': documentUrl,
      'createdBy': createdBy,
    };
  }
} 