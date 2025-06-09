class User {
  final String? id;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? serviceNumber;
  final String? company;
  final String? rank;
  final String? role;
  final String? profilePicture;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    this.id,
    this.firstName,
    this.lastName,
    this.email,
    this.serviceNumber,
    this.company,
    this.rank,
    this.role,
    this.profilePicture,
    this.createdAt,
    this.updatedAt,
  });

  // Create a User from a JSON object
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      email: json['email'],
      serviceNumber: json['serviceNumber'] ?? json['serialNumber'],
      company: json['company'] ?? json['unit'],
      rank: json['rank'],
      role: json['role'],
      profilePicture: json['profilePicture'],
      createdAt: json['createdAt'] != null 
        ? DateTime.parse(json['createdAt']) 
        : null,
      updatedAt: json['updatedAt'] != null 
        ? DateTime.parse(json['updatedAt']) 
        : null,
    );
  }

  // Convert User to a JSON object
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'serviceNumber': serviceNumber,
      'company': company,
      'rank': rank,
      'role': role,
      'profilePicture': profilePicture,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  // Get full name
  String get fullName => '$firstName $lastName';
} 