import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/theme/app_theme.dart';
import '../core/constants/app_constants.dart';

class CustomTextField extends StatefulWidget {
  final TextEditingController controller;
  final String? labelText;
  final String? hintText;
  final IconData? prefixIcon;
  final bool isPassword;
  final String? Function(String?)? validator;
  final TextInputType keyboardType;
  final bool autoFocus;
  final FocusNode? focusNode;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;
  final String? initialValue;
  final Widget? suffix;
  final bool readOnly;
  final int? maxLines;
  final int? minLines;
  final EdgeInsetsGeometry? contentPadding;
  final bool enabled;

  const CustomTextField({
    Key? key,
    required this.controller,
    this.labelText,
    this.hintText,
    this.prefixIcon,
    this.isPassword = false,
    this.validator,
    this.keyboardType = TextInputType.text,
    this.autoFocus = false,
    this.focusNode,
    this.onChanged,
    this.onSubmitted,
    this.initialValue,
    this.suffix,
    this.readOnly = false,
    this.maxLines = 1,
    this.minLines,
    this.contentPadding,
    this.enabled = true,
  }) : super(key: key);

  @override
  _CustomTextFieldState createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: widget.isPassword,
      keyboardType: widget.keyboardType,
      validator: widget.validator,
      onChanged: widget.onChanged,
      textCapitalization: TextCapitalization.none,
      inputFormatters: [],
      maxLines: widget.maxLines,
      minLines: widget.minLines,
      enabled: widget.enabled,
      focusNode: widget.focusNode,
      autofocus: widget.autoFocus,
      style: const TextStyle(
        fontSize: 16,
        color: AppTheme.textPrimaryColor,
        fontFamily: 'Poppins',
      ),
      decoration: InputDecoration(
        labelText: widget.labelText,
        hintText: widget.hintText,
        prefixIcon: widget.prefixIcon != null 
            ? Icon(
                widget.prefixIcon,
                color: Colors.grey.shade600,
                size: 22,
              ) 
            : null,
        suffixIcon: widget.suffix,
        filled: true,
        fillColor: const Color(0xFFF2F5F9),
        contentPadding: widget.contentPadding ?? const EdgeInsets.symmetric(
          horizontal: AppConstants.defaultPadding,
          vertical: 16.0,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppTheme.primaryColor,
            width: 2.0,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppTheme.errorColor,
            width: 1.0,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: AppTheme.errorColor,
            width: 2.0,
          ),
        ),
        labelStyle: const TextStyle(
          color: AppTheme.textSecondaryColor,
          fontSize: 15,
          fontFamily: 'Poppins',
        ),
        hintStyle: TextStyle(
          color: AppTheme.textSecondaryColor.withOpacity(0.6),
          fontSize: 14,
          fontFamily: 'Poppins',
        ),
        errorStyle: const TextStyle(
          color: AppTheme.errorColor,
          fontSize: 12,
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
} 