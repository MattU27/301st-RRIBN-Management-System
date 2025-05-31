class MongoDBConfig {
  // Connection string options for different environments
  static const String androidEmulatorConnectionString = 'mongodb://10.0.2.2:27017';
  static const String iosSimulatorConnectionString = 'mongodb://localhost:27017';
  static const String localConnectionString = 'mongodb://localhost:27017';
  
  // Database name and collection names
  static const String databaseName = 'afp_personnel_db';
  static const String trainingCollection = 'trainings';
  static const String announcementCollection = 'announcements';
  static const String userCollection = 'personnels'; // Updated to match existing collection
  
  // Connection timeouts
  static const int connectionTimeoutMs = 10000;
  static const int socketTimeoutMs = 30000;
} 