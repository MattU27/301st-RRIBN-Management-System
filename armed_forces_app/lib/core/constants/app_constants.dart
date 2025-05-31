class AppConstants {
  // App information
  static const String appName = 'Armed Forces of the Philippines';
  static const String appVersion = '1.0.0';
  
  // API endpoints
  static const String baseUrl = 'https://api.armedforces.ph';
  static const String apiVersion = 'v1';
  
  // Storage keys
  static const String authTokenKey = 'auth_token';
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
  static const String roleOfficer = 'officer';
  static const String roleEnlisted = 'enlisted';
  
  // Notification types
  static const String notificationTypeAnnouncement = 'announcement';
  static const String notificationTypeTraining = 'training';
  static const String notificationTypeDocument = 'document';
  
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
  
  // API Routes
  static const String loginEndpoint = '$baseUrl/auth/login';
  static const String registerEndpoint = '$baseUrl/auth/register';
  static const String refreshTokenEndpoint = '$baseUrl/auth/refresh';
  static const String forgotPasswordEndpoint = '$baseUrl/auth/forgot-password';
  static const String resetByServiceIdEndpoint = '$baseUrl/auth/recover-password/service-id';
  static const String resetPasswordEndpoint = '$baseUrl/auth/reset-password';
  static const String validateTokenEndpoint = '$baseUrl/auth/validate-token';
  
  // User Endpoints
  static const String userProfileEndpoint = '$baseUrl/user/profile';
  static const String updateProfileEndpoint = '$baseUrl/user/profile/update';
  static const String changePasswordEndpoint = '$baseUrl/user/change-password';
  
  // Document Endpoints
  static const String documentsEndpoint = '$baseUrl/documents';
  static const String uploadDocumentEndpoint = '$baseUrl/documents/upload';
  static const String documentVerificationEndpoint = '$baseUrl/documents/verify';
  
  // Training Endpoints
  static const String trainingsEndpoint = '$baseUrl/trainings';
  static const String registerTrainingEndpoint = '$baseUrl/trainings/register';
  static const String myTrainingsEndpoint = '$baseUrl/trainings/my-trainings';
  static const String attendedTrainingsEndpoint = '$baseUrl/trainings/attended';
  
  // Policy Endpoints
  static const String policiesEndpoint = '$baseUrl/policies';
  
  // Announcement Endpoints
  static const String announcementsEndpoint = '$baseUrl/announcements';
  
  // Calendar Endpoints
  static const String calendarEventsEndpoint = '$baseUrl/calendar';
  
  // Local Storage Keys
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userRoleKey = 'user_role';
  static const String firstTimeKey = 'first_time';
  static const String lastSyncTimeKey = 'last_sync_time';
  static const String themeKey = 'app_theme';
  static const String notificationsKey = 'notifications_enabled';
  
  // App-specific Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double buttonRadius = 12.0;
  static const double cardRadius = 16.0;
  static const double defaultBorderWidth = 1.0;
  static const double defaultIconSize = 24.0;
  static const double smallIconSize = 16.0;
  static const double largeIconSize = 32.0;
  static const int defaultAnimationDuration = 300; // milliseconds
  
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
    'ID Card', 
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