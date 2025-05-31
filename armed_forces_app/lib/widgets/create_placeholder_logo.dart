import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';

/// This is a utility class to create a placeholder logo for development
/// Run this in your main.dart temporarily to generate the logo
class LogoGenerator {
  static Future<void> createPlaceholderLogo() async {
    // Get the application documents directory
    final directory = await getApplicationDocumentsDirectory();
    final assetsDir = Directory('${directory.path}/../assets/images');
    
    if (!await assetsDir.exists()) {
      await assetsDir.create(recursive: true);
    }
    
    final logoPath = '${assetsDir.path}/301st_logo.png';
    
    // Check if the logo already exists
    final logoFile = File(logoPath);
    if (await logoFile.exists()) {
      print('Logo already exists at: $logoPath');
      return;
    }
    
    // Create a basic circular logo with text
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final size = Size(200, 200);
    
    // Draw a blue circle
    final paint = Paint()
      ..color = Colors.blue.shade800
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), size.width / 2, paint);
    
    // Draw a gold border
    final borderPaint = Paint()
      ..color = Colors.amber
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10;
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), size.width / 2 - 5, borderPaint);
    
    // Add text "301st"
    final textPainter = TextPainter(
      text: TextSpan(
        text: '301st',
        style: TextStyle(
          color: Colors.white,
          fontSize: 48,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        size.width / 2 - textPainter.width / 2,
        size.height / 2 - textPainter.height / 2,
      ),
    );
    
    // Convert to image
    final picture = recorder.endRecording();
    final img = await picture.toImage(size.width.toInt(), size.height.toInt());
    final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
    final buffer = byteData!.buffer.asUint8List();
    
    // Save to file
    await logoFile.writeAsBytes(buffer);
    print('Created placeholder logo at: $logoPath');
  }
} 