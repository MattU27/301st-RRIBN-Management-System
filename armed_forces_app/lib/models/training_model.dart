class Training {
  final String id;
  final String title;
  final String type; // 'Basic Military Training', 'Leadership Course', etc.
  final String? description;
  final DateTime startDate;
  final DateTime endDate;
  final String location;
  final String? instructorName;
  final String? instructorRank;
  final int capacity;
  final int registeredCount;
  final bool isMandatory;
  final String? prerequisites;
  final String status; // 'scheduled', 'ongoing', 'completed', 'cancelled'
  final DateTime createdAt;
  final DateTime updatedAt;
  final String createdBy; // Staff/Admin ID who created the training
  final List<String>? targetCompanies; // Which companies this training is for
  final List<String>? targetRanks; // Which ranks this training is for
  final String? notes;
  final String? certificationOffered;
  final int? certificationValidityMonths;
  final List<TrainingAgenda>? agenda;

  Training({
    required this.id,
    required this.title,
    required this.type,
    this.description,
    required this.startDate,
    required this.endDate,
    required this.location,
    this.instructorName,
    this.instructorRank,
    required this.capacity,
    required this.registeredCount,
    required this.isMandatory,
    this.prerequisites,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.createdBy,
    this.targetCompanies,
    this.targetRanks,
    this.notes,
    this.certificationOffered,
    this.certificationValidityMonths,
    this.agenda,
  });

  bool get isScheduled => status == 'scheduled';
  bool get isOngoing => status == 'ongoing';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get hasCapacity => registeredCount < capacity;
  bool get isUpcoming => startDate.isAfter(DateTime.now());
  bool get isCurrentlyRunning => DateTime.now().isAfter(startDate) && DateTime.now().isBefore(endDate);
  bool get offersCertification => certificationOffered != null && certificationOffered!.isNotEmpty;
  int get durationInDays => endDate.difference(startDate).inDays + 1;

  factory Training.fromJson(Map<String, dynamic> json) {
    return Training(
      id: json['id'],
      title: json['title'],
      type: json['type'],
      description: json['description'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      location: json['location'],
      instructorName: json['instructorName'],
      instructorRank: json['instructorRank'],
      capacity: json['capacity'],
      registeredCount: json['registeredCount'],
      isMandatory: json['isMandatory'],
      prerequisites: json['prerequisites'],
      status: json['status'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      createdBy: json['createdBy'],
      targetCompanies: json['targetCompanies'] != null 
          ? List<String>.from(json['targetCompanies']) 
          : null,
      targetRanks: json['targetRanks'] != null 
          ? List<String>.from(json['targetRanks']) 
          : null,
      notes: json['notes'],
      certificationOffered: json['certificationOffered'],
      certificationValidityMonths: json['certificationValidityMonths'],
      agenda: json['agenda'] != null
          ? (json['agenda'] as List).map((a) => TrainingAgenda.fromJson(a)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'type': type,
      'description': description,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'location': location,
      'instructorName': instructorName,
      'instructorRank': instructorRank,
      'capacity': capacity,
      'registeredCount': registeredCount,
      'isMandatory': isMandatory,
      'prerequisites': prerequisites,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'createdBy': createdBy,
      'targetCompanies': targetCompanies,
      'targetRanks': targetRanks,
      'notes': notes,
      'certificationOffered': certificationOffered,
      'certificationValidityMonths': certificationValidityMonths,
      'agenda': agenda?.map((a) => a.toJson()).toList(),
    };
  }
}

class TrainingAgenda {
  final String id;
  final String title;
  final String? description;
  final DateTime date;
  final String startTime;
  final String endTime;
  final String? instructor;
  final String? location;
  final String? materials;

  TrainingAgenda({
    required this.id,
    required this.title,
    this.description,
    required this.date,
    required this.startTime,
    required this.endTime,
    this.instructor,
    this.location,
    this.materials,
  });

  factory TrainingAgenda.fromJson(Map<String, dynamic> json) {
    return TrainingAgenda(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      date: DateTime.parse(json['date']),
      startTime: json['startTime'],
      endTime: json['endTime'],
      instructor: json['instructor'],
      location: json['location'],
      materials: json['materials'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'date': date.toIso8601String(),
      'startTime': startTime,
      'endTime': endTime,
      'instructor': instructor,
      'location': location,
      'materials': materials,
    };
  }
}

class TrainingRegistration {
  final String id;
  final String trainingId;
  final String userId;
  final DateTime registrationDate;
  final String status; // 'registered', 'attended', 'cancelled', 'absent'
  final String? notes;
  final bool hasCertificate;
  final String? certificateUrl;
  final DateTime? certificateIssuedDate;
  final DateTime? certificateExpiryDate;

  TrainingRegistration({
    required this.id,
    required this.trainingId,
    required this.userId,
    required this.registrationDate,
    required this.status,
    this.notes,
    required this.hasCertificate,
    this.certificateUrl,
    this.certificateIssuedDate,
    this.certificateExpiryDate,
  });

  bool get isRegistered => status == 'registered';
  bool get hasAttended => status == 'attended';
  bool get isCancelled => status == 'cancelled';
  bool get wasAbsent => status == 'absent';
  bool get certificateIsValid => certificateExpiryDate != null && 
      DateTime.now().isBefore(certificateExpiryDate!);

  factory TrainingRegistration.fromJson(Map<String, dynamic> json) {
    return TrainingRegistration(
      id: json['id'],
      trainingId: json['trainingId'],
      userId: json['userId'],
      registrationDate: DateTime.parse(json['registrationDate']),
      status: json['status'],
      notes: json['notes'],
      hasCertificate: json['hasCertificate'] ?? false,
      certificateUrl: json['certificateUrl'],
      certificateIssuedDate: json['certificateIssuedDate'] != null 
          ? DateTime.parse(json['certificateIssuedDate']) 
          : null,
      certificateExpiryDate: json['certificateExpiryDate'] != null 
          ? DateTime.parse(json['certificateExpiryDate']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'trainingId': trainingId,
      'userId': userId,
      'registrationDate': registrationDate.toIso8601String(),
      'status': status,
      'notes': notes,
      'hasCertificate': hasCertificate,
      'certificateUrl': certificateUrl,
      'certificateIssuedDate': certificateIssuedDate?.toIso8601String(),
      'certificateExpiryDate': certificateExpiryDate?.toIso8601String(),
    };
  }
} 