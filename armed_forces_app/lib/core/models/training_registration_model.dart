import 'package:mongo_dart/mongo_dart.dart' as mongo;

class TrainingRegistration {
  final mongo.ObjectId? id;
  final mongo.ObjectId trainingId;
  final mongo.ObjectId userId;
  final String status; // 'registered', 'attended', 'completed', 'absent', 'canceled'
  final DateTime registrationDate;
  final DateTime? attendanceDate;
  final DateTime? completionDate;
  final int? score;
  final String? feedback;
  final String? certificate;
  final Map<String, dynamic>? additionalInfo;
  final DateTime createdAt;
  final DateTime updatedAt;

  TrainingRegistration({
    this.id,
    required this.trainingId,
    required this.userId,
    required this.status,
    required this.registrationDate,
    this.attendanceDate,
    this.completionDate,
    this.score,
    this.feedback,
    this.certificate,
    this.additionalInfo,
    required this.createdAt,
    required this.updatedAt,
  });

  // Create a TrainingRegistration object from a MongoDB document
  factory TrainingRegistration.fromMap(Map<String, dynamic> map) {
    return TrainingRegistration(
      id: map['_id'] as mongo.ObjectId?,
      trainingId: map['trainingId'] as mongo.ObjectId,
      userId: map['userId'] as mongo.ObjectId,
      status: map['status'] as String,
      registrationDate: map['registrationDate'] is DateTime
          ? map['registrationDate'] as DateTime
          : DateTime.parse(map['registrationDate'] as String),
      attendanceDate: map['attendanceDate'] != null
          ? (map['attendanceDate'] is DateTime
              ? map['attendanceDate'] as DateTime
              : DateTime.parse(map['attendanceDate'] as String))
          : null,
      completionDate: map['completionDate'] != null
          ? (map['completionDate'] is DateTime
              ? map['completionDate'] as DateTime
              : DateTime.parse(map['completionDate'] as String))
          : null,
      score: map['score'] as int?,
      feedback: map['feedback'] as String?,
      certificate: map['certificate'] as String?,
      additionalInfo: map['additionalInfo'] as Map<String, dynamic>?,
      createdAt: map['createdAt'] is DateTime
          ? map['createdAt'] as DateTime
          : DateTime.parse(map['createdAt'] as String),
      updatedAt: map['updatedAt'] is DateTime
          ? map['updatedAt'] as DateTime
          : DateTime.parse(map['updatedAt'] as String),
    );
  }

  // Convert TrainingRegistration object to a MongoDB document
  Map<String, dynamic> toMap() {
    return {
      if (id != null) '_id': id,
      'trainingId': trainingId,
      'userId': userId,
      'status': status,
      'registrationDate': registrationDate,
      'attendanceDate': attendanceDate,
      'completionDate': completionDate,
      'score': score,
      'feedback': feedback,
      'certificate': certificate,
      'additionalInfo': additionalInfo,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  // Check if registration is active
  bool get isActive => status == 'registered';

  // Check if user has attended
  bool get hasAttended => attendanceDate != null;

  // Check if user has completed
  bool get hasCompleted => completionDate != null;

  // Create a copy of this TrainingRegistration with the given fields updated
  TrainingRegistration copyWith({
    mongo.ObjectId? id,
    mongo.ObjectId? trainingId,
    mongo.ObjectId? userId,
    String? status,
    DateTime? registrationDate,
    DateTime? attendanceDate,
    DateTime? completionDate,
    int? score,
    String? feedback,
    String? certificate,
    Map<String, dynamic>? additionalInfo,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TrainingRegistration(
      id: id ?? this.id,
      trainingId: trainingId ?? this.trainingId,
      userId: userId ?? this.userId,
      status: status ?? this.status,
      registrationDate: registrationDate ?? this.registrationDate,
      attendanceDate: attendanceDate ?? this.attendanceDate,
      completionDate: completionDate ?? this.completionDate,
      score: score ?? this.score,
      feedback: feedback ?? this.feedback,
      certificate: certificate ?? this.certificate,
      additionalInfo: additionalInfo ?? this.additionalInfo,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
} 