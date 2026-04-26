import 'package:flutter/material.dart';
import 'package:core/core.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

class DgSnackbar {
  static void showSuccess(BuildContext context, {required String message}) {
    _showCustomToast(context, message, isError: false);
  }

  static void showError(BuildContext context, {String? message, dynamic error}) {
    String finalMessage = message ?? 'Terjadi kesalahan';
    if (error != null) {
      finalMessage = ErrorHandler.getMessage(error);
    }
    _showCustomToast(context, finalMessage, isError: true);
  }

  static void _showCustomToast(BuildContext context, String message, {required bool isError}) {
    final overlay = Overlay.of(context);
    late OverlayEntry overlayEntry;

    final color = isError ? AppColors.error : AppColors.primary;
    final icon = isError ? Icons.error_outline : Icons.check_circle_outline;

    overlayEntry = OverlayEntry(
      builder: (context) => _ToastAnimationWidget(
        message: message,
        color: color,
        icon: icon,
        onDismissed: () {
          overlayEntry.remove();
        },
      ),
    );

    overlay.insert(overlayEntry);
  }
}

class _ToastAnimationWidget extends StatefulWidget {
  final String message;
  final Color color;
  final IconData icon;
  final VoidCallback onDismissed;

  const _ToastAnimationWidget({
    required this.message,
    required this.color,
    required this.icon,
    required this.onDismissed,
  });

  @override
  State<_ToastAnimationWidget> createState() => _ToastAnimationWidgetState();
}

class _ToastAnimationWidgetState extends State<_ToastAnimationWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    
    // Elastic drop animation
    _offsetAnimation = Tween<Offset>(begin: const Offset(0, -1.5), end: const Offset(0, 0)).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.5, curve: Curves.easeIn)),
    );

    _controller.forward();

    // Auto dismiss after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        _controller.reverse().then((_) {
          widget.onDismissed();
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 16,
      left: 16,
      right: 16,
      child: SafeArea(
        child: Material(
          color: Colors.transparent,
          child: SlideTransition(
            position: _offsetAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: widget.color.withOpacity(0.15),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: widget.color.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(widget.icon, color: widget.color, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.message,
                        style: AppTypography.bodyMedium.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
