import 'package:flutter/material.dart';
import 'package:ui_kit/ui_kit.dart';
import 'package:intl/intl.dart';
import 'package:core/core.dart';

class DgPromoVoucherCard extends StatelessWidget {
  final PromoCode promo;
  final VoidCallback? onTap;
  final double? width;
  final bool isEligible;
  final double? currentSubtotal;

  const DgPromoVoucherCard({
    super.key,
    required this.promo,
    this.onTap,
    this.width = 280,
    this.isEligible = true,
    this.currentSubtotal,
  });

  static Widget shimmer({double width = 280}) {
    return Container(
      width: width,
      height: 170,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const DgShimmer(width: 80, height: 12),
                  const SizedBox(height: 12),
                  const DgShimmer(width: 180, height: 16),
                  const SizedBox(height: 8),
                  const DgShimmer(width: 120, height: 12),
                ],
              ),
            ),
          ),
          const Divider(height: 1, thickness: 1, color: AppColors.divider, indent: 20, endIndent: 20),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(
              children: [
                DgShimmer(width: 14, height: 14, isCircle: true),
                SizedBox(width: 6),
                DgShimmer(width: 100, height: 11),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);
    final type = promo.type;
    final value = promo.value;
    final minOrder = promo.minOrder.toDouble();
    final endAt = promo.endAt;

    return GestureDetector(
      onTap: isEligible ? onTap : null,
      child: Opacity(
        opacity: isEligible ? 1.0 : 0.6,
        child: IntrinsicHeight(
          child: Container(
            width: width,
            constraints: const BoxConstraints(minHeight: 170),
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
                ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: 120),
                  child: Padding(
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
                            type == PromoType.percent 
                              ? 'Diskon $value% (s.d ${fmt.format(promo.maxDiscount ?? 0)})' 
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
                          if (promo.allowedPaymentMethods.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Row(
                                children: [
                                  const Text('KHUSUS: ', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.orange)),
                                  ...promo.allowedPaymentMethods.map((m) {
                                    final method = m.name.toLowerCase();
                                    final iconName = method.startsWith('va_') ? method.replaceFirst('va_', '') : (method == 'va' ? 'bca' : method);
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 4),
                                      child: Image.asset(
                                        'assets/images/payments/$iconName.png',
                                        height: 12,
                                        fit: BoxFit.contain,
                                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            )
                          else if (promo.allowCod == false)
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
                          if (!isEligible && currentSubtotal != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Belanja kurang ${fmt.format(minOrder - currentSubtotal!)} lagi',
                                style: const TextStyle(color: AppColors.error, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
            
            // The "Ticket" Notch Divider
            Stack(
              alignment: Alignment.center,
              clipBehavior: Clip.none,
              children: [
                const Divider(height: 1, thickness: 1, color: AppColors.divider, indent: 20, endIndent: 20),
                Positioned(
                  left: -8,
                  child: _buildNotch(),
                ),
                Positioned(
                  right: -8,
                  child: _buildNotch(),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    height: 1,
                    width: double.infinity,
                    decoration: const BoxDecoration(
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
      ),
    ),
  );
}

  Widget _buildNotch() {
    return Container(
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: AppColors.background,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.divider.withOpacity(0.5)),
      ),
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
