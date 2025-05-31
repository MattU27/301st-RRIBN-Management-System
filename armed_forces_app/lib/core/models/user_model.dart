class User {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? profileImageUrl;
  final String rank;
  final String serialNumber;
  final String unit;
  final String? company;
  final String? status;
  final String role;
  final bool isAdmin;
  final bool isActive;
  final String? phoneNumber;
  final DateTime? dateOfBirth;
  final String? address;
  final DateTime? joiningDate;
  final List<String>? specializations;
  final String? bloodType;
  final DateTime? lastLogin;
  final DateTime createdAt;

  String? get serviceNumber => serialNumber;

  User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.profileImageUrl,
    required this.rank,
    required this.serialNumber,
    required this.unit,
    this.company,
    this.status,
    this.role = 'user',
    this.isAdmin = false,
    this.isActive = true,
    this.phoneNumber,
    this.dateOfBirth,
    this.address,
    this.joiningDate,
    this.specializations,
    this.bloodType,
    this.lastLogin,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Helper function to safely get values
    T? safeGet<T>(String key, {T? defaultValue}) {
      final value = json[key];
      if (value == null) return defaultValue;
      if (value is T) return value;
      return defaultValue;
    }
    
    return User(
      id: safeGet<String>('id') ?? json['_id']?.toString() ?? '',
      firstName: safeGet<String>('firstName') ?? '',
      lastName: safeGet<String>('lastName') ?? '',
      email: safeGet<String>('email') ?? '',
      profileImageUrl: safeGet<String>('profileImageUrl') ?? safeGet<String>('photoUrl'),
      rank: safeGet<String>('rank') ?? '',
      serialNumber: safeGet<String>('serialNumber') ?? safeGet<String>('serviceNumber') ?? '',
      unit: safeGet<String>('unit') ?? safeGet<String>('company') ?? '',
      company: safeGet<String>('company'),
      status: safeGet<String>('status'),
      role: safeGet<String>('role') ?? 'user',
      isAdmin: safeGet<bool>('isAdmin') ?? false,
      isActive: safeGet<bool>('isActive') ?? true,
      phoneNumber: safeGet<String>('phoneNumber') ?? safeGet<String>('phone'),
      dateOfBirth: json['dateOfBirth'] != null ? DateTime.parse(json['dateOfBirth'].toString()) : null,
      address: safeGet<String>('address'),
      joiningDate: json['joiningDate'] != null 
          ? DateTime.parse(json['joiningDate'].toString()) 
          : json['dateJoined'] != null 
              ? DateTime.parse(json['dateJoined'].toString()) 
              : null,
      specializations: json['specializations'] != null 
        ? (json['specializations'] is List 
            ? List<String>.from(json['specializations'])
            : <String>[]) 
        : null,
      bloodType: safeGet<String>('bloodType'),
      lastLogin: json['lastLogin'] != null ? DateTime.parse(json['lastLogin'].toString()) : null,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'].toString()) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'profileImageUrl': profileImageUrl,
      'rank': rank,
      'serialNumber': serialNumber,
      'unit': unit,
      'company': company,
      'status': status,
      'role': role,
      'isAdmin': isAdmin,
      'isActive': isActive,
      'phoneNumber': phoneNumber,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'address': address,
      'joiningDate': joiningDate?.toIso8601String(),
      'specializations': specializations,
      'bloodType': bloodType,
      'lastLogin': lastLogin?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  String get fullName => '$firstName $lastName';
} 