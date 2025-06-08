class AppConstants {
  // App information
  static const String appName = 'Armed Forces of the Philippines';
  static const String appVersion = '1.0.0';
  
  // API endpoints - Updated to use Render deployment
  static const String baseUrl = 'https://301st-rribn-management-system.onrender.com'; // Render deployment URL
  static const String socketUrl = 'https://301st-rribn-management-system.onrender.com'; // Socket.IO server URL
  // Alternative URLs for different environments
  static const String localUrl = 'http://localhost:3000';
  static const String emulatorUrl = 'http://10.0.2.2:3000';
  static const String productionUrl = 'https://301st-rribn-management-system.onrender.com';
  
  static const String apiVersion = 'v1';
  static const String databaseName = 'afp_personnel_db'; // MongoDB database name
  
  // Storage keys
  static const String authTokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  static const String userDataKey = 'user_data';
  static const String rememberMeKey = 'remember_me';
  
  // Timeouts
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  
  // Pagination defaults
  static const int defaultPageSize = 10;
  
  // Date formats
  static const String dateFormat = 'MMM d, yyyy';
  static const String dateTimeFormat = 'MMM d, yyyy h:mm a';
  
  // Document status
  static const String documentStatusPending = 'pending';
  static const String documentStatusApproved = 'approved';
  static const String documentStatusRejected = 'rejected';
  
  // Training status
  static const String trainingStatusUpcoming = 'upcoming';
  static const String trainingStatusInProgress = 'in-progress';
  static const String trainingStatusCompleted = 'completed';
  static const String trainingStatusCancelled = 'cancelled';
  
  // User roles
  static const String roleAdmin = 'admin';
  static const String roleDirector = 'director';
  static const String roleStaff = 'staff';
  static const String roleOfficer = 'officer';
  static const String roleEnlisted = 'enlisted';
  
  // Policy status
  static const String policyStatusDraft = 'draft';
  static const String policyStatusPublished = 'published';
  static const String policyStatusArchived = 'archived';
  
  // Notification types
  static const String notificationTypeAnnouncement = 'announcement';
  static const String notificationTypeTraining = 'training';
  static const String notificationTypeDocument = 'document';
  static const String notificationTypePolicy = 'policy';
  
  // Error messages
  static const String errorGeneric = 'An error occurred. Please try again.';
  static const String errorNetwork = 'Network error. Please check your connection.';
  static const String errorTimeout = 'Request timed out. Please try again.';
  static const String errorServer = 'Server error. Please try again later.';
  static const String errorAuth = 'Authentication failed. Please log in again.';
  
  // Success messages
  static const String successLogin = 'Successfully logged in.';
  static const String successLogout = 'Successfully logged out.';
  static const String successRegistration = 'Successfully registered.';
  static const String successPasswordReset = 'Password reset successfully.';
  static const String successDocumentUpload = 'Document uploaded successfully.';
  static const String successProfileUpdate = 'Profile updated successfully.';
  
  // API Routes - Updated to match the Next.js backend
  static const String loginEndpoint = '$baseUrl/api/auth/login';
  static const String registerEndpoint = '$baseUrl/api/auth/register';
  static const String refreshTokenEndpoint = '$baseUrl/api/auth/refresh';
  static const String forgotPasswordEndpoint = '$baseUrl/api/auth/forgot-password';
  static const String resetPasswordEndpoint = '$baseUrl/api/auth/reset-password';
  static const String validateTokenEndpoint = '$baseUrl/api/auth/validate-token';
  
  // User Endpoints
  static const String userProfileEndpoint = '$baseUrl/api/user/profile';
  static const String updateProfileEndpoint = '$baseUrl/api/user/update';
  static const String changePasswordEndpoint = '$baseUrl/api/user/change-password';
  
  // Document Endpoints
  static const String documentsEndpoint = '$baseUrl/api/documents';
  static const String uploadDocumentEndpoint = '$baseUrl/api/documents/upload';
  
  // Training Endpoints
  static const String trainingsEndpoint = '$baseUrl/api/trainings';
  
  // Policy Endpoints - Updated to match Next.js backend
  static const String policiesEndpoint = '$baseUrl/api/v1/policies';
  static const String policyUploadEndpoint = '$baseUrl/api/v1/policies/upload';
  static const String policyDocumentEndpoint = '$baseUrl/api/v1/policies/document';
  
  // Announcement Endpoints
  static const String announcementsEndpoint = '$baseUrl/api/announcements';
  
  // Local Storage Keys
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userRoleKey = 'user_role';
  
  // App-specific Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double buttonRadius = 12.0;
  static const double cardRadius = 16.0;
  
  // Military-specific constants
  static const List<String> militaryRanks = [
    'Private',
    'Corporal',
    'Sergeant',
    'Staff Sergeant',
    'Master Sergeant',
    'First Sergeant',
    'Sergeant Major',
    'Second Lieutenant',
    'First Lieutenant',
    'Captain',
    'Major',
    'Lieutenant Colonel',
    'Colonel',
    'Brigadier General',
    'Major General',
    'Lieutenant General',
    'General',
  ];
  
  static const List<String> companies = [
    'Alpha Company',
    'Bravo Company',
    'Charlie Company',
    'Headquarters',
    'NERRSC (Signal Company)',
    'NERRFAB (Artillery Battery)',
  ];
  
  static const List<String> reservistStatus = [
    'Ready', 
    'Standby', 
    'Retired'
  ];
  
  // Document types
  static const List<String> documentTypes = [
    'Birth Certificate',
    'ID Card', 
    'Picture 2x2',
    '3R ROTC Certificate',
    'Enlistment Order',
    'Promotion Order',
    'Order of Incorporation',
    'Schooling Certificate',
    'College Diploma',
    'RIDS',
    'Medical Certificate', 
    'Training Certificate', 
    'Deployment Order', 
    'Commendation', 
    'Other'
  ];
  
  // Security classifications
  static const List<String> securityClassifications = [
    'Unclassified', 
    'Confidential', 
    'Secret', 
    'Top Secret'
  ];
  
  // Training types
  static const List<String> trainingTypes = [
    'Basic Military Training', 
    'Advanced Infantry Training', 
    'Leadership Course', 
    'Medical Training', 
    'Communications', 
    'Weapons Training', 
    'Special Operations', 
    'Other'
  ];
} 