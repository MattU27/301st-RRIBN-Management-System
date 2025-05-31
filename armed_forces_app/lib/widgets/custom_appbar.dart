import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

class CustomAppBar extends AppBar {
  CustomAppBar({
    Key? key,
    required String title,
    bool showBackButton = false,
    VoidCallback? onBackPressed,
    List<Widget>? actions,
    Color? backgroundColor,
    Color? foregroundColor,
    double elevation = 0,
    Widget? leading,
    bool centerTitle = true,
    PreferredSizeWidget? bottom,
  }) : super(
          key: key,
          title: Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          leading: showBackButton
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: onBackPressed ?? () {},
                )
              : leading,
          actions: actions,
          backgroundColor: backgroundColor ?? AppTheme.primaryColor,
          foregroundColor: foregroundColor ?? Colors.white,
          elevation: elevation,
          centerTitle: centerTitle,
          bottom: bottom,
        );
}

// A version with gradient background
class GradientAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool centerTitle;
  final bool hasBackButton;
  final VoidCallback? onBackPressed;
  final double? elevation;
  final Widget? leading;
  final PreferredSizeWidget? bottom;
  final List<Color>? gradientColors;

  const GradientAppBar({
    Key? key,
    required this.title,
    this.actions,
    this.centerTitle = true,
    this.hasBackButton = true,
    this.onBackPressed,
    this.elevation,
    this.leading,
    this.bottom,
    this.gradientColors,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final colors = gradientColors ?? [
      AppTheme.primaryColor,
      AppTheme.primaryColor.withOpacity(0.7),
    ];

    return AppBar(
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      centerTitle: centerTitle,
      backgroundColor: Colors.transparent,
      elevation: elevation ?? 0,
      leading: hasBackButton && Navigator.canPop(context)
          ? leading ?? IconButton(
              icon: const Icon(Icons.arrow_back_ios),
              onPressed: onBackPressed ?? () => Navigator.pop(context),
            )
          : leading,
      actions: actions,
      bottom: bottom,
      automaticallyImplyLeading: hasBackButton,
      flexibleSpace: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: colors,
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(bottom != null ? kToolbarHeight + 48 : kToolbarHeight);
} 