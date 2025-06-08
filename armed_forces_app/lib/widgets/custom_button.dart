import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

import '../core/constants/app_constants.dart';
import '../core/theme/app_theme.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isOutlined;
  final Color? backgroundColor;
  final Color? textColor;
  final double? width;
  final double? height;
  final IconData? icon;
  final double borderRadius;
  final EdgeInsetsGeometry? padding;
  final double elevation;

  const CustomButton({
    Key? key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.backgroundColor,
    this.textColor,
    this.width,
    this.height,
    this.icon,
    this.borderRadius = AppConstants.buttonRadius,
    this.padding,
    this.elevation = 2,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final buttonBackgroundColor = isOutlined
        ? Colors.transparent
        : backgroundColor ?? AppTheme.primaryColor;
    
    final buttonTextColor = isOutlined
        ? textColor ?? AppTheme.primaryColor
        : textColor ?? Colors.white;
    
    final buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: buttonBackgroundColor,
      foregroundColor: buttonTextColor,
      elevation: isOutlined ? 0 : elevation,
      shadowColor: AppTheme.primaryColor.withOpacity(0.3),
      padding: padding ?? const EdgeInsets.symmetric(
        vertical: 16.0,
        horizontal: 24.0,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        side: isOutlined
            ? BorderSide(color: textColor ?? AppTheme.primaryColor, width: 2)
            : BorderSide.none,
      ),
      minimumSize: Size(width ?? double.infinity, height ?? 52),
    ).copyWith(
      overlayColor: MaterialStateProperty.resolveWith<Color?>(
        (Set<MaterialState> states) {
          if (states.contains(MaterialState.pressed))
            return buttonTextColor.withOpacity(0.1);
          return null;
        },
      ),
    );

    if (isLoading) {
      return ElevatedButton(
        style: buttonStyle,
        onPressed: null, // Disable button when loading
        child: Center(
          child: SpinKitThreeBounce(
            color: buttonTextColor,
            size: 24.0,
          ),
        ),
      );
    }

    if (icon != null) {
      return ElevatedButton.icon(
        style: buttonStyle,
        onPressed: onPressed,
        icon: Icon(icon, size: 20),
        label: Text(
          text,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
            color: buttonTextColor,
          ),
        ),
      );
    }

    return ElevatedButton(
      style: buttonStyle,
      onPressed: onPressed,
      child: Text(
        text,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
          color: buttonTextColor,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
} 