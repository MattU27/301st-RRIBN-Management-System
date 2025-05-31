class User {
  final String id;
  final String email;
  final String role; // 'user', 'staff', 'admin', 'director'
  final String firstName;
  final String lastName;
  final String? middleName;
  final String? phoneNumber;
  final String? profileImageUrl;
  final String? rank;
  final String? company; // Alpha, Bravo, Charlie, HQ, Signal, FAB
  final String? status; // Ready, Standby, Retired, Inactive
  final String? serviceNumber; // Service ID number
  final DateTime? dateOfBirth;
  final String? address;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final DateTime? joiningDate;
  final String? bloodType;
  final List<String>? specializations;
  final bool isVerified;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.role,
    required this.firstName,
    required this.lastName,
    this.middleName,
    this.phoneNumber,
    this.profileImageUrl,
    this.rank,
    this.company,
    this.status,
    this.serviceNumber,
    this.dateOfBirth,
    this.address,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.joiningDate,
    this.bloodType,
    this.specializations,
    required this.isVerified,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName ${middleName != null ? '$middleName ' : ''}$lastName';
  String get displayName => '$rank $lastName';
  bool get isReservist => role == 'reservist' || role == 'user';
  bool get isStaff => role == 'staff';
  bool get isAdmin => role == 'admin';
  bool get isDirector => role == 'director';
  bool get isReady => status == 'Ready';
  bool get isStandby => status == 'Standby';
  bool get isRetired => status == 'Retired';
  bool get isInactive => status == 'Inactive';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id']?.toString() ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      middleName: json['middleName'],
      phoneNumber: json['phoneNumber'],
      profileImageUrl: json['profileImageUrl'],
      rank: json['rank'],
      company: json['company'],
      status: json['status'],
      serviceNumber: json['serviceNumber'],
      dateOfBirth: json['dateOfBirth'] != null ? DateTime.parse(json['dateOfBirth']) : null,
      address: json['address'],
      emergencyContactName: json['emergencyContactName'],
      emergencyContactPhone: json['emergencyContactPhone'] ?? json['emergencyPhone'],
      joiningDate: json['joiningDate'] != null ? DateTime.parse(json['joiningDate']) : 
                   json['dateJoined'] != null ? DateTime.parse(json['dateJoined']) : null,
      bloodType: json['bloodType'],
      specializations: json['specializations'] != null 
        ? List<String>.from(json['specializations']) 
        : null,
      isVerified: json['isVerified'] ?? false,
      isActive: json['isActive'] ?? false,
      createdAt: json['createdAt'] != null ? 
                 (json['createdAt'] is String ? DateTime.parse(json['createdAt']) : DateTime.now()) : 
                 DateTime.now(),
      updatedAt: json['updatedAt'] != null ? 
                 (json['updatedAt'] is String ? DateTime.parse(json['updatedAt']) : DateTime.now()) : 
                 DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'firstName': firstName,
      'lastName': lastName,
      'middleName': middleName,
      'phoneNumber': phoneNumber,
      'profileImageUrl': profileImageUrl,
      'rank': rank,
      'company': company,
      'status': status,
      'serviceNumber': serviceNumber,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'address': address,
      'emergencyContactName': emergencyContactName,
      'emergencyContactPhone': emergencyContactPhone,
      'joiningDate': joiningDate?.toIso8601String(),
      'bloodType': bloodType,
      'specializations': specializations,
      'isVerified': isVerified,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? role,
    String? firstName,
    String? lastName,
    String? middleName,
    String? phoneNumber,
    String? profileImageUrl,
    String? rank,
    String? company,
    String? status,
    String? serviceNumber,
    DateTime? dateOfBirth,
    String? address,
    String? emergencyContactName,
    String? emergencyContactPhone,
    DateTime? joiningDate,
    String? bloodType,
    List<String>? specializations,
    bool? isVerified,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      role: role ?? this.role,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      middleName: middleName ?? this.middleName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      rank: rank ?? this.rank,
      company: company ?? this.company,
      status: status ?? this.status,
      serviceNumber: serviceNumber ?? this.serviceNumber,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      address: address ?? this.address,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone: emergencyContactPhone ?? this.emergencyContactPhone,
      joiningDate: joiningDate ?? this.joiningDate,
      bloodType: bloodType ?? this.bloodType,
      specializations: specializations ?? this.specializations,
      isVerified: isVerified ?? this.isVerified,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
} 