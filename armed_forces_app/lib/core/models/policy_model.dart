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
        if (dateValue is Map) {
          // Check for $date field
          if (dateValue.containsKey('\$date')) {
            if (dateValue['\$date'] is String) {
              return DateTime.parse(dateValue['\$date']);
            } else if (dateValue['\$date'] is int) {
              return DateTime.fromMillisecondsSinceEpoch(dateValue['\$date']);
            }
          }
          
          // If it's a map but doesn't have $date field, try other common MongoDB date fields
          for (final key in dateValue.keys) {
            if (key.toString().contains('date') || key.toString().contains('Date')) {
              final value = dateValue[key];
              if (value is String) {
                try {
                  return DateTime.parse(value);
                } catch (_) {}
              } else if (value is int) {
                try {
                  return DateTime.fromMillisecondsSinceEpoch(value);
                } catch (_) {}
              }
            }
          }
        }
        
        // Handle string date format
        if (dateValue is String) {
          // Check if the string is a MongoDB ISO date format
          if (dateValue.startsWith('ISODate(') && dateValue.endsWith(')')) {
            // Extract the date string from ISODate("2025-05-31T00:00:00.000Z")
            final dateString = dateValue.substring(9, dateValue.length - 2);
            return DateTime.parse(dateString);
          }
          
          // Handle date strings without time component
          if (!dateValue.contains('T') && dateValue.contains('-')) {
            // Add time component to make it a valid ISO date
            return DateTime.parse('${dateValue}T00:00:00.000Z');
          }
          
          // Try to parse as regular ISO date
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
    
    // Extract dates with special handling for MongoDB formats
    DateTime getEffectiveDate() {
      // First try the standard field
      final effectiveDateValue = json['effectiveDate'];
      
      if (effectiveDateValue != null) {
        return parseDate(effectiveDateValue, defaultValue: DateTime.now());
      }
      
      // If not found, check for MongoDB specific formats
      if (json.containsKey('effectiveDate.\$date')) {
        return parseDate(json['effectiveDate.\$date'], defaultValue: DateTime.now());
      }
      
      // Default fallback
      return DateTime.now();
    }
    
    DateTime? getExpirationDate() {
      // First try the standard field
      final expirationDateValue = json['expirationDate'];
      
      if (expirationDateValue != null) {
        return parseDate(expirationDateValue);
      }
      
      // If not found, check for MongoDB specific formats
      if (json.containsKey('expirationDate.\$date')) {
        return parseDate(json['expirationDate.\$date']);
      }
      
      // Return null if no expiration date is found
      return null;
    }
    
    // Get created and updated dates
    DateTime getCreatedAt() {
      // Try multiple possible field names
      final possibleFields = ['createdAt', 'created_at', 'dateCreated'];
      
      for (final field in possibleFields) {
        if (json.containsKey(field)) {
          return parseDate(json[field], defaultValue: DateTime.now());
        }
      }
      
      return DateTime.now();
    }
    
    DateTime getUpdatedAt() {
      // Try multiple possible field names
      final possibleFields = ['updatedAt', 'updated_at', 'lastUpdated', 'dateUpdated'];
      
      for (final field in possibleFields) {
        if (json.containsKey(field)) {
          return parseDate(json[field], defaultValue: DateTime.now());
        }
      }
      
      // If no update date is found, use created date
      return getCreatedAt();
    }
    
    return Policy(
      id: getId(),
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      content: json['content'] ?? '',
      category: json['category'] ?? '',
      version: json['version'] ?? '',
      status: json['status'] ?? 'draft',
      effectiveDate: getEffectiveDate(),
      expirationDate: getExpirationDate(),
      lastUpdated: getUpdatedAt(),
      createdAt: getCreatedAt(),
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