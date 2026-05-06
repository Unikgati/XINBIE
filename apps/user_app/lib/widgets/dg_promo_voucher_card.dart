import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:intl/intl.dart';

class DgPromoVoucherCard extends StatelessWidget {
  final Map<String, dynamic> promo;
  final VoidCallback? onTap;

  const DgPromoVoucherCard({
    super.key,
    required this.promo,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);
    final type = promo['type'] as String;
    final value = promo['value'] as num;
    final minOrder = (promo['minOrder'] as num).toDouble();
    final endAt = promo['endAt'] != null ? DateTime.parse(promo['endAt']) : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 280,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.divider.withOpacity(0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Icon(Icons.confirmation_num_outlined, 
                      size: 40, color: AppColors.primary.withOpacity(0.1)),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'PROMO BELANJA',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          type == 'PERCENT' 
                            ? 'Diskon $value% (s.d ${fmt.format(promo['maxDiscount'] ?? 0)})' 
                            : 'Potongan Langsung ${fmt.format(value)}',
                          style: AppTypography.h4.copyWith(fontSize: 15, height: 1.3),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Min. belanja ${fmt.format(minOrder)}',
                          style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                        ),
                        if (promo['allowCod'] == false)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Row(
                              children: [
                                const Icon(Icons.payments_outlined, size: 14, color: Colors.orange),
                                const SizedBox(width: 4),
                                Text(
                                  'NON-COD',
                                  style: TextStyle(fontSize: 10, color: Colors.orange[700], fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // The "Ticket" Notch Divider
            Stack(
              alignment: Alignment.center,
              children: [
                const Divider(height: 1, thickness: 1, color: AppColors.divider, indent: 20, endIndent: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildNotch(isLeft: true),
                    _buildNotch(isLeft: false),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    height: 1,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: Colors.white, width: 2, style: BorderStyle.none)),
                    ),
                    child: CustomPaint(painter: DashLinePainter()),
                  ),
                ),
              ],
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  Icon(Icons.schedule, size: 14, color: AppColors.textHint),
                  const SizedBox(width: 6),
                  Text(
                    endAt != null 
                      ? 'Berlaku s.d ${DateFormat('d MMM y', 'id').format(endAt)}' 
                      : 'Berlaku selamanya',
                    style: AppTypography.bodySmall.copyWith(color: AppColors.textHint, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotch({required bool isLeft}) {
    return Container(
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: AppColors.background,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
      ),
      margin: EdgeInsets.only(left: isLeft ? -8 : 0, right: isLeft ? 0 : -8),
    );
  }
}

class DashLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    var paint = Paint()
      ..color = AppColors.divider
      ..strokeWidth = 1;
    var max = size.width;
    var dashWidth = 5;
    var dashSpace = 3;
    double startX = 0;
    while (startX < max) {
      canvas.drawLine(Offset(startX, 0), Offset(startX + dashWidth, 0), paint);
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
