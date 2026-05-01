import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ui_kit/theme/app_colors.dart';
import 'package:ui_kit/theme/app_typography.dart';

class IncomingOrderOverlay extends StatefulWidget {
  const IncomingOrderOverlay({super.key, required this.orderData});

  final Map<String, dynamic> orderData;

  /// Shows the overlay and returns true if accepted, false if rejected/timeout
  static Future<bool> show(BuildContext context, Map<String, dynamic> data) async {
    final result = await showGeneralDialog<bool>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.transparent,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return IncomingOrderOverlay(orderData: data);
      },
    );
    return result ?? false;
  }

  @override
  State<IncomingOrderOverlay> createState() => _IncomingOrderOverlayState();
}

class _IncomingOrderOverlayState extends State<IncomingOrderOverlay>
    with TickerProviderStateMixin {
  static const int _totalSeconds = 40;
  Timer? _timer;
  int _timeLeft = _totalSeconds;

  // Slide to accept
  double _slideX = 0;
  double _maxSlide = 0;
  bool _accepted = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        _timer?.cancel();
        if (mounted) Navigator.of(context).pop(false);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatCurrency(dynamic amount) {
    final val = (amount is int) ? amount : int.tryParse(amount.toString()) ?? 0;
    if (val >= 1000000) return 'Rp. ${(val / 1000000).toStringAsFixed(1)}jt';
    if (val >= 1000) return 'Rp. ${(val / 1000).toStringAsFixed(0)}.000';
    return 'Rp. $val';
  }

  @override
  Widget build(BuildContext context) {
    final code = widget.orderData['code'] ?? '';
    final addressObj = widget.orderData['addressSnapshot'] as Map<String, dynamic>? ?? {};
    final customer = addressObj['recipientName'] ?? 'Pelanggan';
    final address = addressObj['fullAddress'] ?? 'Alamat tidak diketahui';
    final total = widget.orderData['grandTotal'] ?? 0;
    final fee = widget.orderData['deliveryFee'] ?? 0;
    final items = widget.orderData['items'] as List? ?? [];
    final itemCount = items.length;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // ── Green Header with Timer ──
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 24,
              bottom: 24,
            ),
            decoration: const BoxDecoration(
              gradient: AppColors.heroGradient,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Text(
                  'Orderan Baru Masuk!',
                  style: AppTypography.h1.copyWith(color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  'Terima order ini sebelum waktu habis',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
                const SizedBox(height: 24),

                // Circular Timer
                SizedBox(
                  width: 120,
                  height: 120,
                  child: CustomPaint(
                    painter: _CircleTimerPainter(
                      progress: _timeLeft / _totalSeconds,
                      isLow: _timeLeft <= 10,
                    ),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$_timeLeft',
                            style: AppTypography.h1.copyWith(
                              color: Colors.white,
                              fontSize: 40,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            'detik',
                            style: AppTypography.bodySmall.copyWith(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Warning banner
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.info_outline, color: Colors.white, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        'Order akan diberikan ke driver lain jika tidak merespon.',
                        style: AppTypography.caption.copyWith(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Order Info Card ──
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: AppColors.shadow, blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Order code
                    Text('#$code', style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(height: 12),

                    // Customer info row
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: AppColors.primarySurface,
                          child: const Icon(Icons.person_outline, color: AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(customer, style: AppTypography.h4),
                              Text(
                                '$itemCount item',
                                style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('Total Bayar', style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                            Text(_formatCurrency(total), style: AppTypography.h4.copyWith(color: AppColors.primaryDark)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Pickup & Dropoff
                    _buildRouteItem(
                      icon: Icons.circle_outlined,
                      iconColor: AppColors.primary,
                      label: 'Pickup',
                      value: 'Gudang DapurGizi',
                      isFirst: true,
                    ),
                    _buildRouteLine(),
                    _buildRouteItem(
                      icon: Icons.location_on,
                      iconColor: AppColors.error,
                      label: 'Dropoff',
                      value: customer,
                      subtitle: address,
                      isFirst: false,
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 12),

                    // Estimasi & Fee
                    Row(
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.access_time, size: 18, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Estimasi Waktu', style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                                  Text('10 menit', style: AppTypography.labelLarge),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Row(
                            children: [
                              const Icon(Icons.monetization_on, size: 18, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Fee', style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
                                  Text(_formatCurrency(fee), style: AppTypography.labelLarge.copyWith(color: AppColors.success)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Slide to Accept ──
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: LayoutBuilder(
              builder: (context, constraints) {
                _maxSlide = constraints.maxWidth - 64; // thumb width
                return Container(
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Stack(
                    children: [
                      // Label
                      Center(
                        child: Text(
                          'Slide untuk menerima',
                          style: AppTypography.button.copyWith(color: Colors.white),
                        ),
                      ),
                      // Draggable thumb
                      Positioned(
                        left: _slideX,
                        top: 4,
                        child: GestureDetector(
                          onHorizontalDragUpdate: (details) {
                            setState(() {
                              _slideX = (_slideX + details.delta.dx).clamp(0, _maxSlide);
                            });
                          },
                          onHorizontalDragEnd: (details) {
                            if (_slideX >= _maxSlide * 0.85) {
                              // Accepted!
                              setState(() => _accepted = true);
                              _timer?.cancel();
                              Navigator.of(context).pop(true);
                            } else {
                              // Snap back
                              setState(() => _slideX = 0);
                            }
                          },
                          child: Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 4),
                              ],
                            ),
                            child: const Icon(Icons.check, color: AppColors.primary, size: 28),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }

  Widget _buildRouteItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    String? subtitle,
    required bool isFirst,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: iconColor),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.caption.copyWith(color: AppColors.textSecondary)),
              Text(value, style: AppTypography.h4),
              if (subtitle != null)
                Text(subtitle, style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRouteLine() {
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: Column(
        children: List.generate(3, (_) => Container(
          width: 2,
          height: 6,
          margin: const EdgeInsets.symmetric(vertical: 2),
          color: AppColors.border,
        )),
      ),
    );
  }
}

/// Draws a circular progress ring for the countdown timer.
class _CircleTimerPainter extends CustomPainter {
  final double progress; // 1.0 = full, 0.0 = empty
  final bool isLow;

  _CircleTimerPainter({required this.progress, required this.isLow});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 6;

    // Background circle
    final bgPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5;
    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = isLow ? Colors.redAccent : Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi * progress,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _CircleTimerPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.isLow != isLow;
}
