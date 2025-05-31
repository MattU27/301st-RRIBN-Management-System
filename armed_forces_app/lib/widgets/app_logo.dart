import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme/app_theme.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool showBackground;
  final bool showShadow;
  final bool useCircularClip;
  
  const AppLogo({
    Key? key,
    this.size = 80,
    this.showBackground = true,
    this.showShadow = true,
    this.useCircularClip = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Widget logoContent = Image.asset(
      'assets/images/301st_logo.png',
      width: useCircularClip ? size * 0.875 : size,
      height: useCircularClip ? size * 0.875 : size,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        // Show a text fallback if the image can't be loaded
        return Center(
          child: Text(
            "301st",
            style: GoogleFonts.robotoCondensed(
              fontSize: size * 0.3,
              fontWeight: FontWeight.bold,
              color: showBackground 
                  ? AppTheme.primaryColor
                  : Colors.white,
            ),
          ),
        );
      },
    );
    
    // Apply circular clipping if requested
    if (useCircularClip) {
      logoContent = ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: logoContent,
      );
    }
    
    // If we should show a background, wrap in a container
    if (showBackground) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: showShadow ? [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ] : null,
        ),
        child: Center(
          child: logoContent,
        ),
      );
    }
    
    return logoContent;
  }
} 