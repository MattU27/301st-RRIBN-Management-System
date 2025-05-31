import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'core/services/auth_service.dart';
import 'core/services/announcement_service.dart';
import 'core/services/training_service.dart';
import 'core/constants/app_constants.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/training_details_screen.dart';

// Flag to enable dev mode features (should be false for production builds)
// Using kDebugMode from foundation.dart will automatically be false in release builds
const bool kEnableDevMode = kDebugMode;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set preferred orientations
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppTheme.primaryColor,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  runApp(const ArmedForcesApp());
}

class ArmedForcesApp extends StatelessWidget {
  const ArmedForcesApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Create instances of services for the entire app
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => AnnouncementService()),
        ChangeNotifierProvider(create: (_) => TrainingService()),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        // Start with the splash screen
        home: const SplashScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/dashboard': (context) => const DashboardScreen(),
          '/forgot_password': (context) => const ForgotPasswordScreen(),
        },
        // Handle dashboard route with parameters
        onGenerateRoute: (settings) {
          if (settings.name == '/dashboard') {
            // Extract the arguments if available
            final args = settings.arguments as Map<String, dynamic>?;
            
            return MaterialPageRoute(
              settings: settings,
              builder: (context) => DashboardScreen(
                initialTabIndex: args?['initialTabIndex'] ?? 0,
                params: args?['params'],
              ),
            );
          }
          
          // Training details route
          if (settings.name == '/training-details') {
            // Extract the arguments
            final args = settings.arguments as Map<String, dynamic>;
            
            return MaterialPageRoute(
              settings: settings,
              builder: (context) => TrainingDetailsScreen(
                trainingId: args['trainingId'] as String?,
                training: args['training'],
              ),
            );
          }
          
          return null;
        },
        // If a route isn't found, go to the login screen
        onUnknownRoute: (settings) {
          return MaterialPageRoute(builder: (context) => const LoginScreen());
        },
      ),
    );
  }
}
