import 'package:mongo_dart/mongo_dart.dart' as mongo;

class RegisteredPersonnel {
  final mongo.ObjectId? id;
  final mongo.ObjectId? userId;
  final String rank;
  final String firstName;
  final String lastName;
  final String serviceId;
  final String status;
  final DateTime registrationDate;

  RegisteredPersonnel({
    this.id,
    this.userId,
    required this.rank,
    required this.firstName,
    required this.lastName,
    required this.serviceId,
    required this.status,
    required this.registrationDate,
  });

  String get fullName => '$firstName $lastName';

  // Create a RegisteredPersonnel object from a MongoDB registration document with user data
  factory RegisteredPersonnel.fromMap(Map<String, dynamic> map) {
    // Extract user data from nested structure
    final userMap = map['user'] as Map<String, dynamic>? ?? {};
    final registrationMap = map['registration'] as Map<String, dynamic>? ?? {};
    
    return RegisteredPersonnel(
      id: registrationMap['_id'] as mongo.ObjectId?,
      userId: userMap['id'] as mongo.ObjectId?,
      rank: userMap['rank'] as String? ?? 'N/A',
      firstName: userMap['firstName'] as String? ?? '',
      lastName: userMap['lastName'] as String? ?? '',
      serviceId: userMap['serialNumber'] as String? ?? 'Unknown',
      status: registrationMap['status'] as String? ?? 'registered',
      registrationDate: registrationMap['registrationDate'] is DateTime
          ? registrationMap['registrationDate'] as DateTime
          : registrationMap['registrationDate'] != null
              ? DateTime.parse(registrationMap['registrationDate'] as String)
              : DateTime.now(),
    );
  }

  // Convert RegisteredPersonnel object to a formatted map for display
  Map<String, dynamic> toDisplayMap() {
    return {
      'rank': rank,
      'name': fullName,
      'serviceId': serviceId,
      'status': status,
      'registrationDate': registrationDate,
    };
  }
} 