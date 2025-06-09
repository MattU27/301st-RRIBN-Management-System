import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Main colors
  static const primaryColor = Color(0xFF0D47A1);  // Dark Blue
  static const primaryLightColor = Color(0xFF5472D3);
  static const primaryDarkColor = Color(0xFF002171);
  static const secondaryColor = Color(0xFF4D8B31);  // Military Green
  static const accentColor = Color(0xFFFFC107);  // Amber
  static const errorColor = Color(0xFFD32F2F);  // Red
  
  // Military-specific colors
  static const militaryGreen = Color(0xFF4D8B31);
  static const militaryRed = Color(0xFFD9534F);
  
  // Text colors
  static const primaryTextColor = Colors.black87;
  static const secondaryTextColor = Colors.black54;
  static const lightTextColor = Colors.white;
  static const textPrimaryColor = Color(0xFF212529);
  static const textSecondaryColor = Color(0xFF6C757D);
  
  // Background colors
  static const scaffoldBackgroundColor = Colors.white;
  static const cardColor = Colors.white;
  
  // Status colors
  static const successColor = Color(0xFF4CAF50);
  static const warningColor = Color(0xFFFFA000);
  static const infoColor = Color(0xFF2196F3);

  // Theme data
  static ThemeData get lightTheme {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: accentColor,
        error: errorColor,
      ),
      primaryColor: primaryColor,
      // Text themes
      textTheme: const TextTheme(
        titleLarge: TextStyle(
          fontSize: 20.0,
          fontWeight: FontWeight.bold,
          color: primaryTextColor,
        ),
        titleMedium: TextStyle(
          fontSize: 18.0,
          fontWeight: FontWeight.w600,
          color: primaryTextColor,
        ),
        bodyLarge: TextStyle(
          fontSize: 16.0,
          color: primaryTextColor,
        ),
        bodyMedium: TextStyle(
          fontSize: 14.0,
          color: primaryTextColor,
        ),
        bodySmall: TextStyle(
          fontSize: 12.0,
          color: secondaryTextColor,
        ),
      ),
      // AppBar theme
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: lightTextColor,
        elevation: 0,
      ),
      // Button themes
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          foregroundColor: lightTextColor,
          backgroundColor: primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
      // Input decoration theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.grey[100],
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryColor, width: 1),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: errorColor, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: errorColor, width: 1.5),
        ),
      ),
      // Card theme
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        color: cardColor,
      ),
      // Scaffold background color
      scaffoldBackgroundColor: scaffoldBackgroundColor,
      // Other themes
      visualDensity: VisualDensity.adaptivePlatformDensity,
    );
  }
  
  static ThemeData get darkTheme {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        primary: primaryColor,
        secondary: accentColor,
        error: errorColor,
        brightness: Brightness.dark,
      ),
      primaryColor: primaryColor,
      // Other dark theme settings would go here
      scaffoldBackgroundColor: const Color(0xFF121212),
      cardColor: const Color(0xFF1E1E1E),
      visualDensity: VisualDensity.adaptivePlatformDensity,
    );
  }
} 