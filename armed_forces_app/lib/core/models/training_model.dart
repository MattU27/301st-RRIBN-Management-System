import 'package:mongo_dart/mongo_dart.dart' as mongo;

class Training {
  final mongo.ObjectId? id;
  final String title;
  final String description;
  final String category;
  final DateTime startDate;
  final DateTime endDate;
  final String location;
  final String status;
  final bool isRequired;
  final int capacity;
  final int registered;
  final String? instructorName;
  final String? instructorId;
  final bool isActive;
  final List<Map<String, dynamic>>? attendees;
  final DateTime createdAt;
  final DateTime updatedAt;

  Training({
    this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.startDate,
    required this.endDate,
    required this.location,
    required this.status,
    required this.isRequired,
    required this.capacity,
    required this.registered,
    this.instructorName,
    this.instructorId,
    this.isActive = true,
    this.attendees,
    required this.createdAt,
    required this.updatedAt,
  });

  // Create a Training object from a MongoDB document
  factory Training.fromMap(Map<String, dynamic> map) {
    // Process attendees if present
    List<Map<String, dynamic>>? processedAttendees;
    if (map['attendees'] != null && map['attendees'] is List) {
      processedAttendees = (map['attendees'] as List)
          .map((attendee) => attendee is Map ? 
                Map<String, dynamic>.from(attendee) : 
                <String, dynamic>{})
          .toList();
    }
    
    // Add defensive null checks and provide defaults
    return Training(
      id: map['_id'] as mongo.ObjectId?,
      title: map['title'] as String? ?? 'Untitled Training',
      description: map['description'] as String? ?? 'No description available',
      // Use 'type' field for category if available, otherwise look for 'category'
      category: map['type'] as String? ?? map['category'] as String? ?? 'General',
      startDate: map['startDate'] is DateTime
          ? map['startDate'] as DateTime
          : map['startDate'] != null
              ? DateTime.parse(map['startDate'] as String)
              : DateTime.now(),
      endDate: map['endDate'] is DateTime
          ? map['endDate'] as DateTime
          : map['endDate'] != null
              ? DateTime.parse(map['endDate'] as String)
              : DateTime.now().add(const Duration(days: 1)),
      // Improved handling of location which could be string, map or null
      location: map['location'] is String
          ? map['location'] as String
          : map['location'] is Map
              ? _formatLocationFromMap(map['location'] as Map)
              : 'No location specified',
      status: map['status'] as String? ?? 'upcoming',
      isRequired: map['mandatory'] as bool? ?? false,  // Changed from isRequired to mandatory based on DB screenshot
      capacity: map['capacity'] as int? ?? 30,
      registered: map['registered'] as int? ?? 0,
      // Handle instructor which might be an object or direct string
      instructorName: map['instructor'] is Map 
          ? (map['instructor'] as Map)['name'] as String?
          : map['instructorName'] as String?,
      instructorId: map['instructor'] is Map
          ? (map['instructor'] as Map)['id']?.toString()
          : map['instructorId'] as String?,
      isActive: map['isActive'] as bool? ?? true,
      attendees: processedAttendees,
      createdAt: map['createdAt'] is DateTime
          ? map['createdAt'] as DateTime
          : map['createdAt'] != null
              ? DateTime.parse(map['createdAt'] as String)
              : DateTime.now(),
      updatedAt: map['updatedAt'] is DateTime
          ? map['updatedAt'] as DateTime
          : map['updatedAt'] != null
              ? DateTime.parse(map['updatedAt'] as String)
              : DateTime.now(),
    );
  }

  // Helper method to format location map
  static String _formatLocationFromMap(Map locationMap) {
    String result = '';
    
    if (locationMap.containsKey('name')) {
      result += locationMap['name'].toString();
    }
    
    if (locationMap.containsKey('address')) {
      if (result.isNotEmpty) result += ', ';
      result += locationMap['address'].toString();
    }
    
    if (result.isEmpty && locationMap.isNotEmpty) {
      // If we didn't find standard fields but map has data, format nicely instead of raw toString
      result = locationMap.entries
          .map((e) => '${e.key}: ${e.value}')
          .join(', ');
    }
    
    // Truncate if very long (over 120 chars) to avoid overflow issues
    if (result.length > 120) {
      result = result.substring(0, 117) + '...';
    }
    
    return result.isNotEmpty ? result : 'Unknown location';
  }

  // Convert Training object to a MongoDB document
  Map<String, dynamic> toMap() {
    return {
      if (id != null) '_id': id,
      'title': title,
      'description': description,
      'category': category,
      'startDate': startDate,
      'endDate': endDate,
      'location': location,
      'status': status,
      'isRequired': isRequired,
      'capacity': capacity,
      'registered': registered,
      'instructorName': instructorName,
      'instructorId': instructorId,
      'isActive': isActive,
      if (attendees != null) 'attendees': attendees,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
  
  // Getter for completion percentage
  int get completionPercentage {
    return (registered / capacity * 100).round();
  }
  
  // Check if training is upcoming
  bool get isUpcoming => startDate.isAfter(DateTime.now());
  
  // Check if training is ongoing
  bool get isOngoing {
    final now = DateTime.now();
    return startDate.isBefore(now) && endDate.isAfter(now);
  }
  
  // Check if training is completed
  bool get isCompleted {
    // Check status first
    if (status.toLowerCase() == 'completed') {
      return true;
    }
    
    // For dates far in the future (like 2025), don't automatically mark as completed
    final now = DateTime.now();
    final oneYearFuture = now.add(const Duration(days: 365));
    
    // If the training starts more than a year in the future, it's definitely not completed
    if (startDate.isAfter(oneYearFuture)) {
      return false;
    }
    
    // For normal trainings, it's completed if the end date is in the past
    return endDate.isBefore(now);
  }
  
  // Check if training is full
  bool get isFull => registered >= capacity;
  
  // Create a copy of this Training with the given fields updated
  Training copyWith({
    mongo.ObjectId? id,
    String? title,
    String? description,
    String? category,
    DateTime? startDate,
    DateTime? endDate,
    String? location,
    String? status,
    bool? isRequired,
    int? capacity,
    int? registered,
    String? instructorName,
    String? instructorId,
    bool? isActive,
    List<Map<String, dynamic>>? attendees,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Training(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      location: location ?? this.location,
      status: status ?? this.status,
      isRequired: isRequired ?? this.isRequired,
      capacity: capacity ?? this.capacity,
      registered: registered ?? this.registered,
      instructorName: instructorName ?? this.instructorName,
      instructorId: instructorId ?? this.instructorId,
      isActive: isActive ?? this.isActive,
      attendees: attendees ?? this.attendees,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
} 