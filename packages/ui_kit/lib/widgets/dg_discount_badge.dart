import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class DgDiscountBadge extends StatelessWidget {
  final int discountPercent;

  const DgDiscountBadge({
    super.key,
    required this.discountPercent,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Main Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                _lighten(AppColors.primaryDark, 0.2), // Pantulan terang di ujung kiri atas
                AppColors.primaryDark,                // Warna utama di tengah
                _darken(AppColors.primaryDark, 0.1),  // Bayangan gelap di kanan bawah
              ],
              stops: const [0.0, 0.4, 1.0],
            ),
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(12),
              bottomRight: Radius.circular(12),
              topLeft: Radius.circular(12),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 4,
                offset: const Offset(2, 2),
              ),
            ],
          ),
          child: Text(
            '-$discountPercent%',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        // Fold Triangle
        CustomPaint(
          size: const Size(8, 8),
          painter: _RibbonFoldPainter(color: _darken(AppColors.primaryDark, 0.3)),
        ),
      ],
    );
  }

  Color _darken(Color color, [double amount = .1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(color);
    final hslDark = hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0));
    return hslDark.toColor();
  }

  Color _lighten(Color color, [double amount = .1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(color);
    final hslLight = hsl.withLightness((hsl.lightness + amount).clamp(0.0, 1.0));
    return hslLight.toColor();
  }
}

class _RibbonFoldPainter extends CustomPainter {
  final Color color;

  _RibbonFoldPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path();
    // Start at top-right of the square (which is aligned with the inner left edge of the card)
    path.moveTo(size.width, 0);
    // Draw to top-left (the part that sticks out)
    path.lineTo(0, 0);
    // Draw to bottom-right (points inwards)
    path.lineTo(size.width, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
