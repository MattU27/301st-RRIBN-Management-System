import 'package:intl/intl.dart';
import 'dart:math';

/// Utility class containing methods for formatting various data types
class Formatters {
  /// Format a date range into a readable string
  static String formatDateRange(DateTime start, DateTime end) {
    final DateFormat dateFormat = DateFormat('MMM d, yyyy');
    
    if (start.year == end.year && 
        start.month == end.month && 
        start.day == end.day) {
      return '${dateFormat.format(start)} (1 day)';
    } else {
      final Duration duration = end.difference(start);
      final int days = duration.inDays + 1;
      return '${dateFormat.format(start)} - ${dateFormat.format(end)} ($days days)';
    }
  }

  /// Format a date with time into a readable string
  static String formatDateTime(DateTime date) {
    final DateFormat dateTimeFormat = DateFormat('MMM d, yyyy h:mm a');
    return dateTimeFormat.format(date);
  }

  /// Format a date into a readable string
  static String formatDate(DateTime date) {
    final DateFormat dateFormat = DateFormat('MMM d, yyyy');
    return dateFormat.format(date);
  }

  /// Format a time into a readable string
  static String formatTime(DateTime time) {
    final DateFormat timeFormat = DateFormat('h:mm a');
    return timeFormat.format(time);
  }

  /// Format a number as a currency
  static String formatCurrency(double amount, {String symbol = '\$'}) {
    final NumberFormat formatter = NumberFormat.currency(
      symbol: symbol,
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }

  /// Format a number with commas for thousands
  static String formatNumber(num number) {
    final NumberFormat formatter = NumberFormat('#,##0.##');
    return formatter.format(number);
  }

  /// Format a percentage
  static String formatPercentage(double percentage) {
    final NumberFormat formatter = NumberFormat.percentPattern();
    return formatter.format(percentage / 100);
  }

  /// Format a phone number
  static String formatPhoneNumber(String phoneNumber) {
    // Remove any non-digit characters
    String digitsOnly = phoneNumber.replaceAll(RegExp(r'\D'), '');
    
    // Format based on length
    if (digitsOnly.length == 10) {
      return '(${digitsOnly.substring(0, 3)}) ${digitsOnly.substring(3, 6)}-${digitsOnly.substring(6)}';
    } else if (digitsOnly.length == 11 && digitsOnly.startsWith('1')) {
      return '+1 (${digitsOnly.substring(1, 4)}) ${digitsOnly.substring(4, 7)}-${digitsOnly.substring(7)}';
    }
    
    // Return original if no formatting applied
    return phoneNumber;
  }

  /// Format a string to Title Case
  static String toTitleCase(String text) {
    if (text.isEmpty) return text;
    
    return text.split(' ').map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
  }

  /// Format a file size
  static String formatFileSize(int bytes) {
    if (bytes <= 0) return '0 B';
    
    const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
    int i = (log(bytes) / log(1024)).floor();
    
    return '${(bytes / pow(1024, i)).toStringAsFixed(2)} ${suffixes[i]}';
  }

  /// Format a status string
  static String formatStatus(String status) {
    return status.toUpperCase();
  }
} 