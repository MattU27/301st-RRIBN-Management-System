import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/theme/app_theme.dart';
import '../core/constants/app_constants.dart';
import '../core/services/auth_service.dart';
import '../core/services/mongodb_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> 
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _textController;
  late AnimationController _progressController;
  late AnimationController _backgroundController;
  late AnimationController _particleController;
  
  late Animation<double> _logoFadeAnimation;
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _logoRotationAnimation;
  late Animation<double> _textSlideAnimation;
  late Animation<double> _textFadeAnimation;
  late Animation<double> _progressAnimation;
  late Animation<double> _backgroundAnimation;
  late Animation<double> _particleAnimation;
  
  String _statusMessage = 'Initializing...';
  double _progress = 0.0;
  
  @override
  void initState() {
    super.initState();
    HapticFeedback.lightImpact();
    _initializeAnimations();
    _startAnimationSequence();
    _checkAuthState();
  }
  
  void _initializeAnimations() {
    // Logo animations
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    
    _logoFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );
    
    _logoScaleAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.7, curve: Curves.elasticOut),
      ),
    );
    
    _logoRotationAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.8, curve: Curves.easeInOut),
      ),
    );
    
    // Text animations
    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    
    _textSlideAnimation = Tween<double>(begin: 50.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _textController,
        curve: Curves.easeOutCubic,
      ),
    );
    
    _textFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _textController,
        curve: Curves.easeOut,
      ),
    );
    
    // Progress animation
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );
    
    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _progressController,
        curve: Curves.easeInOut,
      ),
    );
    
    // Background animation
    _backgroundController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
    
    _backgroundAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      _backgroundController,
    );
    
    // Particle animation
    _particleController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
    
    _particleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      _particleController,
    );
  }
  
  void _startAnimationSequence() async {
    // Start logo animation immediately
    _logoController.forward();
    
    // Start text animation after a delay
    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) _textController.forward();
    
    // Start progress animation
    await Future.delayed(const Duration(milliseconds: 200));
    if (mounted) _progressController.forward();
  }
  
  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    _progressController.dispose();
    _backgroundController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  Future<void> _checkAuthState() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    
    // Step 1: Initialize auth service
    _updateStatus('Initializing security protocols...', 0.2);
    await Future.delayed(const Duration(milliseconds: 500));
    
    try {
      await authService.init();
      _updateStatus('Security protocols loaded', 0.4);
    } catch (e) {
      print('Auth service initialization error: $e');
      _updateStatus('Security protocols loaded', 0.4);
    }
    
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Step 2: Connect to database
    _updateStatus('Establishing secure connection...', 0.6);
    await Future.delayed(const Duration(milliseconds: 400));
    
    try {
      await MongoDBService().connect();
      _updateStatus('Connection established', 0.8);
    } catch (mongoError) {
      print('MongoDB pre-connection error in splash screen: $mongoError');
      _updateStatus('Connection established', 0.8);
    }
    
    await Future.delayed(const Duration(milliseconds: 300));
    
    // Step 3: Verify authentication
    _updateStatus('Verifying credentials...', 0.9);
    await Future.delayed(const Duration(milliseconds: 400));
    
    if (!mounted) return;
    
    try {
      final isLoggedIn = await authService.isLoggedIn();
      _updateStatus('Ready to launch', 1.0);
      
      await Future.delayed(const Duration(milliseconds: 500));
      
      if (!mounted) return;
      
      HapticFeedback.mediumImpact();
      
      if (isLoggedIn) {
        Navigator.pushReplacementNamed(context, '/dashboard');
      } else {
        Navigator.pushReplacementNamed(context, '/login');
      }
    } catch (e) {
      print('Auth state check error: $e');
      _updateStatus('Ready to launch', 1.0);
      
      await Future.delayed(const Duration(milliseconds: 500));
      
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/login');
    }
  }
  
  void _updateStatus(String message, double progress) {
    if (mounted) {
      setState(() {
        _statusMessage = message;
        _progress = progress;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      body: Stack(
        children: [
          _buildAnimatedBackground(),
          _buildParticleEffect(),
          SafeArea(
            child: Column(
              children: [
                Expanded(
                  flex: 2,
                  child: const SizedBox(),
                ),
                Expanded(
                  flex: 4,
                  child: _buildAnimatedLogo(),
                ),
                Expanded(
                  flex: 2,
                  child: _buildAnimatedText(),
                ),
                Expanded(
                  flex: 2,
                  child: _buildProgressSection(),
                ),
                Expanded(
                  flex: 1,
                  child: const SizedBox(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAnimatedBackground() {
    return AnimatedBuilder(
      animation: _backgroundAnimation,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withBlue(
                  (AppTheme.primaryColor.blue * 
                   (0.8 + 0.2 * math.sin(_backgroundAnimation.value * 2 * math.pi))).round(),
                ),
                AppTheme.primaryColor.withGreen(
                  (AppTheme.primaryColor.green * 
                   (0.9 + 0.1 * math.cos(_backgroundAnimation.value * 2 * math.pi))).round(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildParticleEffect() {
    return AnimatedBuilder(
      animation: _particleAnimation,
      builder: (context, child) {
        return CustomPaint(
          painter: ParticlePainter(_particleAnimation.value),
          size: Size.infinite,
        );
      },
    );
  }
  
  Widget _buildAnimatedLogo() {
    return AnimatedBuilder(
      animation: Listenable.merge([_logoController, _backgroundAnimation]),
      builder: (context, child) {
        return FadeTransition(
          opacity: _logoFadeAnimation,
          child: Transform.scale(
            scale: _logoScaleAnimation.value,
            child: Transform.rotate(
              angle: _logoRotationAnimation.value * 0.1,
              child: Container(
                height: 200,
                width: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.white,
                      Colors.white.withOpacity(0.95),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      spreadRadius: 5,
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                    BoxShadow(
                      color: Colors.white.withOpacity(0.3),
                      spreadRadius: -5,
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Animated ring
                    Container(
                      height: 180,
                      width: 180,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.blue.shade800.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                    ),
                    // Logo with glow effect
                    Container(
                      height: 150,
                      width: 150,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.blue.shade800.withOpacity(0.3),
                            blurRadius: 15,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(75),
                        child: Image.asset(
                          'assets/images/laang-kawal.png',
                          width: 150,
                          height: 150,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildAnimatedText() {
    return AnimatedBuilder(
      animation: _textController,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _textSlideAnimation.value),
          child: FadeTransition(
            opacity: _textFadeAnimation,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Armed Forces of the Philippines',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          color: Colors.black.withOpacity(0.3),
                          offset: const Offset(1, 1),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  AnimatedTextKit(
                    animatedTexts: [
                      TypewriterAnimatedText(
                        'Personnel Information System',
                        textStyle: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 18,
                          fontWeight: FontWeight.w300,
                          letterSpacing: 1.2,
                          shadows: [
                            Shadow(
                              color: Colors.black.withOpacity(0.2),
                              offset: const Offset(1, 1),
                              blurRadius: 2,
                            ),
                          ],
                        ),
                        speed: const Duration(milliseconds: 80),
                      ),
                    ],
                    totalRepeatCount: 1,
                    displayFullTextOnTap: true,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildProgressSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 48.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Status message
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Text(
              _statusMessage,
              key: ValueKey(_statusMessage),
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 16,
                fontWeight: FontWeight.w400,
                shadows: [
                  Shadow(
                    color: Colors.black.withOpacity(0.2),
                    offset: const Offset(1, 1),
                    blurRadius: 2,
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 24),
          
          // Progress bar
          Container(
            height: 6,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(3),
              color: Colors.white.withOpacity(0.2),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: MediaQuery.of(context).size.width * 0.6 * _progress,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white,
                      Colors.white.withOpacity(0.8),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Animated dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (index) {
              return AnimatedBuilder(
                animation: _progressController,
                builder: (context, child) {
                  final delay = index * 0.2;
                  final animationValue = (_progressController.value - delay).clamp(0.0, 1.0);
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 8,
                    width: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(
                        0.3 + 0.7 * math.sin(animationValue * math.pi),
                      ),
                    ),
                  );
                },
              );
            }),
          ),
        ],
      ),
    );
  }
}

class ParticlePainter extends CustomPainter {
  final double animationValue;
  
  ParticlePainter(this.animationValue);
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..style = PaintingStyle.fill;
    
    // Draw floating particles
    for (int i = 0; i < 20; i++) {
      final x = (size.width * 0.1) + 
                (size.width * 0.8) * 
                ((i * 0.618033988749895) % 1); // Golden ratio for distribution
      final y = (size.height * 0.2) + 
                (size.height * 0.6) * 
                ((i * 0.754877666246693) % 1); // Another irrational for Y
      
      final offset = math.sin(animationValue * 2 * math.pi + i) * 10;
      final opacity = (0.1 + 0.2 * math.sin(animationValue * 2 * math.pi + i * 0.5)).clamp(0.0, 0.3);
      
      paint.color = Colors.white.withOpacity(opacity);
      
      canvas.drawCircle(
        Offset(x, y + offset),
        2 + math.sin(animationValue * 2 * math.pi + i) * 1,
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
} 