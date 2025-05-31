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
    // Handle MongoDB ObjectId format
    String getId() {
      if (json['_id'] == null) return '';
      
      // If _id is a map with $oid field (MongoDB extended JSON format)
      if (json['_id'] is Map && json['_id'].containsKey('\$oid')) {
        return json['_id']['\$oid'] as String;
      }
      
      // If _id is a string
      return json['_id'].toString();
    }
    
    // Parse dates with better error handling
    DateTime parseDate(dynamic dateValue, {DateTime? defaultValue}) {
      if (dateValue == null) return defaultValue ?? DateTime.now();
      
      try {
        // Handle MongoDB date format (ISODate)
        if (dateValue is Map && dateValue.containsKey('\$date')) {
          if (dateValue['\$date'] is String) {
            return DateTime.parse(dateValue['\$date']);
          } else if (dateValue['\$date'] is int) {
            return DateTime.fromMillisecondsSinceEpoch(dateValue['\$date']);
          }
        }
        
        // Handle string date format
        if (dateValue is String) {
          return DateTime.parse(dateValue);
        }
        
        // Handle timestamp (milliseconds since epoch)
        if (dateValue is int) {
          return DateTime.fromMillisecondsSinceEpoch(dateValue);
        }
      } catch (e) {
        print('Error parsing date: $e for value: $dateValue');
      }
      
      return defaultValue ?? DateTime.now();
    }
    
    return Policy(
      id: getId(),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      content: json['content'] ?? '',
      category: json['category'] ?? '',
      version: json['version'] ?? '',
      status: json['status'] ?? 'draft',
      effectiveDate: parseDate(
        json['effectiveDate'], 
        defaultValue: DateTime.now()
      ),
      expirationDate: json['expirationDate'] != null 
          ? parseDate(json['expirationDate']) 
          : null,
      lastUpdated: parseDate(
        json['updatedAt'], 
        defaultValue: DateTime.now()
      ),
      createdAt: parseDate(
        json['createdAt'], 
        defaultValue: DateTime.now()
      ),
      documentUrl: json['documentUrl'] as String?,
      createdBy: json['createdBy'] is Map 
          ? Map<String, dynamic>.from(json['createdBy']) 
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